"use strict";

// Configuration
const API_BASE_URL = 'https://god-1-lsu5.onrender.com';
const TOKEN = localStorage.getItem('token');

// Charts instances
let monthlyChart = null;
let statusChart = null;
let weeklyChart = null;

// Dashboard data
let dashboardData = {
    applications: [],
    stats: {
        total: 0,
        pending: 0,
        processing: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0
    }
};

// Wait for Chart.js to load
function waitForChart() {
    return new Promise((resolve) => {
        if (typeof Chart !== 'undefined') {
            console.log('Chart.js yüklendi:', Chart.version);
            resolve();
        } else {
            setTimeout(() => {
                waitForChart().then(resolve);
            }, 100);
        }
    });
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard başlatılıyor...');
    console.log('Token var mı?', !!TOKEN);
    console.log('API Base URL:', API_BASE_URL);
    
    // Chart.js'in yüklenmesini bekle
    await waitForChart();
    
    checkAuthentication();
    // showLoading(); // Loading ekranını kaldırdık
    loadDashboardData();
});

// Check if user is authenticated
function checkAuthentication() {
    console.log('Authentication kontrol ediliyor...');
    if (!TOKEN) {
        console.log('Token bulunamadı, giriş sayfasına yönlendiriliyor...');
        window.location.href = 'sign-in.html';
        return;
    }
    console.log('Token mevcut:', TOKEN.substring(0, 20) + '...');
}

// Show loading state
function showLoading() {
    // Loading durumunu gösterme - devre dışı bırakıldı
    // console.log('Loading durumu gösteriliyor...');
    // document.getElementById('loadingState').style.display = 'flex';
    // document.getElementById('kt_app_content_container').style.display = 'none';
}

// Hide loading state
function hideLoading() {
    console.log('Loading durumu gizleniyor...');
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('kt_app_content_container').style.display = 'block';
}

// Show error state
function showError() {
    document.getElementById('errorState').classList.remove('d-none');
    document.getElementById('loadingState').style.display = 'none';
}

// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('API çağrısı başlatılıyor...', `${API_BASE_URL}/applications`);
        
        // Önce Chart.js'in yüklü olduğunu kontrol et
        if (typeof Chart === 'undefined') {
            console.log('Chart.js bekleniyor...');
            await waitForChart();
        }
        
        const response = await fetch(`${API_BASE_URL}/applications`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!response.ok) {
            console.error('API hatası:', response.status, response.statusText);
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'sign-in.html';
                return;
            }
            throw new Error(`API Error: ${response.status}`);
        }

        const applications = await response.json();
        console.log('API\'den alınan veri:', applications);
        console.log('Toplam başvuru sayısı:', applications.length);
        
        dashboardData.applications = applications;
        
        // Calculate stats
        calculateStats(applications);
        
        // Update UI
        updateStatsCards();
        updateCharts();
        updateRecentApplicationsTable();
        
        hideLoading();
        
    } catch (error) {
        console.error('Dashboard veri yükleme hatası:', error);
        showError();
    }
}

// Calculate statistics
function calculateStats(applications) {
    dashboardData.stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        processing: applications.filter(app => app.status === 'processing').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        cancelled: applications.filter(app => app.status === 'cancelled').length
    };
}

// Update stats cards
function updateStatsCards() {
    const stats = dashboardData.stats;
    
    document.getElementById('totalApps').textContent = stats.total;
    document.getElementById('pendingApps').textContent = stats.pending;
    document.getElementById('processingApps').textContent = stats.processing;
    document.getElementById('approvedApps').textContent = stats.approved;
    document.getElementById('rejectedApps').textContent = stats.rejected;
    document.getElementById('cancelledApps').textContent = stats.cancelled;
    
    // Calculate changes (mock data for demo)
    document.getElementById('totalChange').innerHTML = `<i class="fas fa-arrow-up fs-5 text-success ms-n1"></i>Bu ay +${Math.floor(stats.total * 0.15)}`;
    document.getElementById('processingChange').innerHTML = `<i class="fas fa-arrow-up fs-5 text-primary ms-n1"></i>Bu hafta +${Math.floor(stats.processing * 0.2)}`;
    document.getElementById('approvedChange').innerHTML = `<i class="fas fa-arrow-up fs-5 text-success ms-n1"></i>Bu hafta +${Math.floor(stats.approved * 0.1)}`;
    
    // Animate numbers
    animateNumbers();
}

// Animate number counting
function animateNumbers() {
    const stats = dashboardData.stats;
    const elements = [
        { id: 'totalApps', target: stats.total },
        { id: 'pendingApps', target: stats.pending },
        { id: 'processingApps', target: stats.processing },
        { id: 'approvedApps', target: stats.approved },
        { id: 'rejectedApps', target: stats.rejected },
        { id: 'cancelledApps', target: stats.cancelled }
    ];
    
    elements.forEach(({ id, target }) => {
        const element = document.getElementById(id);
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 30);
    });
}

// Update charts
function updateCharts() {
    if (typeof Chart === 'undefined') {
        console.log('Chart.js henüz yüklenmedi, chartları atlayıp sadece tabloyu güncelliyoruz...');
        return;
    }
    
    console.log('Chartlar güncelleniyor...');
    updateMonthlyTrendChart();
    updateStatusPieChart();
    updateWeeklyPerformanceChart();
}

// Analiz gerçek tarihlere göre aylık veri üretme
function generateRealMonthlyData() {
    const applications = dashboardData.applications;
    console.log('Aylık analiz için başvurular:', applications);
    
    if (!applications || applications.length === 0) {
        return {
            labels: ['Bu ay'],
            total: [0],
            approved: [0]
        };
    }
    
    const monthlyStats = {};
    const now = new Date();
    
    // Son 6 ayı oluştur
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        
        monthLabels.push(label);
        monthlyStats[key] = { total: 0, approved: 0 };
    }
    
    // Başvuruları aylara ayır
    applications.forEach(app => {
        // Tarih alanını tespit et - farklı olasılıkları dene
        const dateStr = app.created_at || app.created_date || app.date || app.createdAt;
        
        if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (monthlyStats[key]) {
                    monthlyStats[key].total++;
                    if (app.status === 'approved') {
                        monthlyStats[key].approved++;
                    }
                }
            }
        } else {
            // Tarih yoksa bu aya ekle
            const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyStats[currentKey]) {
                monthlyStats[currentKey].total++;
                if (app.status === 'approved') {
                    monthlyStats[currentKey].approved++;
                }
            }
        }
    });
    
    console.log('Aylık istatistikler:', monthlyStats);
    
    const totalData = [];
    const approvedData = [];
    
    Object.values(monthlyStats).forEach(stat => {
        totalData.push(stat.total);
        approvedData.push(stat.approved);
    });
    
    return {
        labels: monthLabels,
        total: totalData,
        approved: approvedData
    };
}

// Analiz gerçek tarihlere göre haftalık veri üretme
function generateRealWeeklyData() {
    const applications = dashboardData.applications;
    console.log('Haftalık analiz için başvurular:', applications);
    
    if (!applications || applications.length === 0) {
        return {
            labels: ['Bu hafta'],
            applications: [0],
            approvals: [0]
        };
    }
    
    const weeklyStats = {};
    const now = new Date();
    
    // Son 4 haftayı oluştur
    const weekLabels = [];
    for (let i = 3; i >= 0; i--) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (i * 7) - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const key = `week-${i}`;
        const label = i === 0 ? 'Bu hafta' : `${i} hafta önce`;
        
        weekLabels.push(label);
        weeklyStats[key] = { 
            applications: 0, 
            approvals: 0,
            startDate: startOfWeek,
            endDate: endOfWeek
        };
    }
    
    // Başvuruları haftalara ayır
    applications.forEach(app => {
        const dateStr = app.created_at || app.created_date || app.date || app.createdAt;
        
        if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                // Hangi haftaya ait olduğunu bul
                Object.entries(weeklyStats).forEach(([key, week]) => {
                    if (date >= week.startDate && date <= week.endDate) {
                        week.applications++;
                        if (app.status === 'approved') {
                            week.approvals++;
                        }
                    }
                });
            }
        } else {
            // Tarih yoksa bu haftaya ekle
            weeklyStats['week-0'].applications++;
            if (app.status === 'approved') {
                weeklyStats['week-0'].approvals++;
            }
        }
    });
    
    console.log('Haftalık istatistikler:', weeklyStats);
    
    const applicationsData = [];
    const approvalsData = [];
    
    Object.values(weeklyStats).forEach(week => {
        applicationsData.push(week.applications);
        approvalsData.push(week.approvals);
    });
    
    return {
        labels: weekLabels,
        applications: applicationsData,
        approvals: approvalsData
    };
}

// Monthly Trend Chart
function updateMonthlyTrendChart() {
    if (typeof Chart === 'undefined') {
        console.log('Chart.js yüklenemedi, monthly chart atlanıyor');
        return;
    }
    
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx) {
        console.log('monthlyTrendChart canvas bulunamadı');
        return;
    }
    
    try {
        const context = ctx.getContext('2d');
        
        // Gerçek verilerden aylık trend oluştur
        const monthlyData = generateRealMonthlyData();
        
        if (monthlyChart) {
            monthlyChart.destroy();
        }
        
        monthlyChart = new Chart(context, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Toplam Başvuru',
                    data: monthlyData.total,
                    borderColor: '#6b7280',
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6b7280',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }, {
                    label: 'Onaylanan',
                    data: monthlyData.approved,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 13,
                                weight: '500'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#a1a5b7',
                            font: {
                                size: 12
                            },
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#a1a5b7',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
        
        console.log('Monthly chart oluşturuldu (gerçek verilerle)');
    } catch (error) {
        console.error('Monthly chart oluşturma hatası:', error);
    }
}

// Status Pie Chart
function updateStatusPieChart() {
    if (typeof Chart === 'undefined') {
        console.log('Chart.js yüklenemedi, status chart atlanıyor');
        return;
    }
    
    const ctx = document.getElementById('statusPieChart');
    if (!ctx) {
        console.log('statusPieChart canvas bulunamadı');
        return;
    }
    
    try {
        const context = ctx.getContext('2d');
        const stats = dashboardData.stats;
        
        if (statusChart) {
            statusChart.destroy();
        }
        
        statusChart = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: ['Beklemede', 'İşleme Alındı', 'Onaylandı', 'Reddedildi', 'İptal Edildi'],
                datasets: [{
                    data: [stats.pending, stats.processing, stats.approved, stats.rejected, stats.cancelled],
                    backgroundColor: [
                        '#db900fff',
                        '#17328aff',
                        '#10b981',
                        '#b61d1dff',
                        '#9ca3af'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        
        console.log('Status chart oluşturuldu');
    } catch (error) {
        console.error('Status chart oluşturma hatası:', error);
    }
}

// Weekly Performance Chart
function updateWeeklyPerformanceChart() {
    if (typeof Chart === 'undefined') {
        console.log('Chart.js yüklenemedi, weekly chart atlanıyor');
        return;
    }
    
    const ctx = document.getElementById('weeklyPerformanceChart');
    if (!ctx) {
        console.log('weeklyPerformanceChart canvas bulunamadı');
        return;
    }
    
    try {
        const context = ctx.getContext('2d');
        
        // Gerçek verilerden haftalık performans oluştur
        const weeklyData = generateRealWeeklyData();
        
        if (weeklyChart) {
            weeklyChart.destroy();
        }
        
        weeklyChart = new Chart(context, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Başvuru',
                    data: weeklyData.applications,
                    backgroundColor: 'rgba(107, 114, 128, 0.8)',
                    borderColor: '#6b7280',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }, {
                    label: 'Onay',
                    data: weeklyData.approvals,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 13,
                                weight: '500'
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#a1a5b7',
                            font: {
                                size: 12
                            },
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#a1a5b7',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Weekly chart oluşturuldu (gerçek verilerle)');
    } catch (error) {
        console.error('Weekly chart oluşturma hatası:', error);
    }
}

// Update recent applications table
function updateRecentApplicationsTable() {
    console.log('Tablo güncelleniyor...');
    console.log('Dashboard applications:', dashboardData.applications);
    
    const tbody = document.querySelector('#recentApplicationsTable tbody');
    if (!tbody) {
        console.error('Tablo tbody elementi bulunamadı!');
        return;
    }
    
    const applications = dashboardData.applications || [];
    console.log('Tablo için kullanılacak başvurular:', applications);
    
    if (applications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-10">
                    <div class="d-flex flex-column flex-center">
                        <i class="fas fa-inbox fs-2x text-gray-400 mb-5"></i>
                        <div class="fw-semibold fs-6 text-gray-600">Henüz başvuru bulunmuyor</div>
                        <div class="text-muted fs-7">İlk başvuru yapıldığında burada görünecektir.</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const recentApplications = applications.slice(-10).reverse();
    console.log('Son 10 başvuru:', recentApplications);
    
    tbody.innerHTML = recentApplications.map((app, index) => {
        console.log(`Başvuru ${index + 1}:`, app);
        
        // Tarih formatı
        let displayDate = 'Bugün';
        let displayTime = new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        
        if (app.created_at) {
            const date = new Date(app.created_at);
            displayDate = date.toLocaleDateString('tr-TR');
            displayTime = date.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
        }
        
        // İnitials
        const firstName = app.ad || 'U';
        const lastName = app.soyad || 'N';
        const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        
        // Status badge
        const statusBadge = getStatusBadge(app.status || 'pending');
        
        return `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center">
                        <div class="kt-symbol kt-symbol-50 kt-symbol-circle me-3">
                            <span class="kt-symbol-label kt-symbol-label-info fw-bold fs-6">
                                ${initials}
                            </span>
                        </div>
                        <div>
                            <a href="#" class="text-gray-900 fw-bold text-hover-primary fs-6" onclick="viewApplication(${app.id || index + 1})">${firstName} ${lastName}</a>
                            <span class="text-muted fw-semibold d-block fs-7">#${app.id || index + 1}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="text-gray-900 fw-bold fs-6">${app.email || 'E-posta yok'}</span>
                        <span class="text-muted fw-semibold fs-7">${app.telefon || 'Telefon yok'}</span>
                    </div>
                </td>
                <td>
                    <span class="kt-badge kt-badge-light-info fs-7 fw-bold">${app.vize_tipi || 'Tourist'}</span>
                    <div class="text-muted fw-semibold fs-7">${app.vize_giris || 'Single Entry'}</div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="text-gray-900 fw-bold fs-6">${displayDate}</span>
                        <span class="text-muted fw-semibold fs-7">${displayTime}</span>
                    </div>
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td class="text-end pe-4">
                    <div class="d-flex justify-content-end flex-shrink-0">
                        <a href="#" class="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1" onclick="viewApplication(${app.id || index + 1})" title="Görüntüle">
                            <i class="fas fa-eye fs-6"></i>
                        </a>
                        <a href="#" class="btn btn-icon btn-bg-light btn-active-color-primary btn-sm" onclick="editApplication(${app.id || index + 1})" title="Düzenle">
                            <i class="fas fa-edit fs-6"></i>
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('Tablo başarıyla güncellendi!');
}

// Get status badge
function getStatusBadge(status) {
    const statusMap = {
        'pending': { class: 'kt-badge-light-warning', text: 'Beklemede' },
        'processing': { class: 'kt-badge-light-info', text: 'İşleme Alındı' },
        'approved': { class: 'kt-badge-light-success', text: 'Onaylandı' },
        'rejected': { class: 'kt-badge-light-danger', text: 'Reddedildi' },
        'cancelled': { class: 'kt-badge-light-info', text: 'İptal Edildi' }
    };
    
    const statusInfo = statusMap[status] || statusMap['pending'];
    return `<span class="kt-badge ${statusInfo.class} fs-7 fw-bold">${statusInfo.text}</span>`;
}

// Application actions
function viewApplication(id) {
    console.log('Başvuru görüntüleme:', id);
    window.location.href = `application-details.html?id=${id}`;
}

function editApplication(id) {
    console.log('Başvuru düzenleme:', id);
    window.location.href = `application-details.html?id=${id}`;
}

// Refresh data
function refreshData() {
    console.log('Veri yenileniyor...');
    // showLoading(); // Loading ekranını kaldırdık
    loadDashboardData();
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'sign-in.html';
}

// Real-time updates (optional)
function startRealTimeUpdates() {
    setInterval(() => {
        loadDashboardData();
    }, 300000); // Update every 5 minutes
}

// Initialize real-time updates after initial load
setTimeout(startRealTimeUpdates, 5000);