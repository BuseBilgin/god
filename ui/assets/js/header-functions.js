/**
 * Header Functions - Search ve Notification Sistemi
 * Her HTML sayfasının footer'ına eklenecek
 */

// Global değişkenler
let notificationCount = 0;
let lastApplicationCount = 0;
let notificationPollingInterval = null;

// API Base URL - Config'den al veya fallback
const HEADER_API_URL = window.APP_CONFIG?.API_BASE_URL || 'https://god-1-lsu5.onrender.com';

// Header fonksiyonları için init
document.addEventListener('DOMContentLoaded', function() {
    initializeHeaderFunctions();
});

function initializeHeaderFunctions() {
    initializeSearch();
    initializeNotifications();
    
    // Real-time bildirimler için polling başlat
    startNotificationPolling();
    
    // Sayfa değiştirmeden önce polling'i durdur
    window.addEventListener('beforeunload', function() {
        if (notificationPollingInterval) {
            clearInterval(notificationPollingInterval);
        }
    });
}

/**
 * ARAMA SİSTEMİ
 */
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;

    // Arama önerilerini gösterecek dropdown oluştur
    const searchDropdown = createSearchDropdown();
    searchInput.parentNode.appendChild(searchDropdown);

    // Arama inputuna event listener'lar ekle
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', handleSearchKeypress);
    searchInput.addEventListener('focus', showSearchHistory);
    
    // Dropdown dışına tıklandığında kapat
    document.addEventListener('click', function(event) {
        if (!searchInput.parentNode.contains(event.target)) {
            hideSearchDropdown();
        }
    });
}

function createSearchDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e4e6ea;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        z-index: 1000;
        max-height: 400px;
        overflow-y: auto;
        display: none;
        margin-top: 5px;
    `;
    return dropdown;
}

function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        hideSearchDropdown();
        return;
    }

    // Debounce arama
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
}

function handleSearchKeypress(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = e.target.value.trim();
        if (query) {
            performDetailedSearch(query);
        }
    }
}

async function performSearch(query) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${HEADER_API_URL}/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Backend'de search endpoint yoksa applications'dan ara
            return searchInApplications(query);
        }

        const results = await response.json();
        displaySearchResults(results, query);
        
    } catch (error) {
        console.log('Search API kullanılamıyor, yerel arama yapılıyor...');
        searchInApplications(query);
    }
}

async function searchInApplications(query) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${HEADER_API_URL}/applications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const applications = await response.json();
            const filteredResults = applications.filter(app => {
                const searchFields = [
                    app.ad, app.soyad, app.email, app.telefon, 
                    app.vize_tipi, app.status, app.id?.toString()
                ];
                
                return searchFields.some(field => 
                    field && field.toLowerCase().includes(query.toLowerCase())
                );
            }).slice(0, 10); // İlk 10 sonuç

            displaySearchResults(filteredResults, query);
        }
    } catch (error) {
        console.error('Arama hatası:', error);
        showSearchError('Arama yapılırken hata oluştu');
    }
}

function displaySearchResults(results, query) {
    const dropdown = document.querySelector('.search-dropdown');
    if (!dropdown) return;

    if (results.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 12px; text-align: center; color: #666;">
                <i class="fas fa-search" style="margin-bottom: 8px;"></i><br>
                "${query}" için sonuç bulunamadı
            </div>
        `;
    } else {
        dropdown.innerHTML = `
            <div style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; color: #666; font-weight: 600;">
                "${query}" için ${results.length} sonuç bulundu
            </div>
            ${results.map(item => `
                <div class="search-result-item" onclick="selectSearchResult('${item.id}', '${item.ad} ${item.soyad}')" 
                     style="padding: 10px 12px; border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.2s;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 2px;">
                        ${item.ad} ${item.soyad}
                        <span style="color: #e30613; font-size: 12px; font-weight: normal;">#${item.id}</span>
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        ${item.email} • ${item.telefon || 'Telefon yok'}
                    </div>
                    <div style="font-size: 11px; color: #999; margin-top: 2px;">
                        ${getStatusText(item.status)} • ${item.vize_tipi || 'Tourist'}
                    </div>
                </div>
            `).join('')}
            <div style="padding: 8px 12px; border-top: 1px solid #eee; text-align: center;">
                <button onclick="performDetailedSearch('${query}')" style="background: #e30613; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    Detaylı Arama Yap
                </button>
            </div>
        `;
    }

    // Hover efektleri ekle
    dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f8f9fa';
        });
        item.addEventListener('mouseleave', function() {
            this.style.background = 'white';
        });
    });

    showSearchDropdown();
}

function selectSearchResult(id, name) {
    // Arama geçmişine ekle
    saveSearchHistory(name);
    
    // İlgili sayfaya yönlendir
    window.location.href = `application-details.html?id=${id}`;
}

function performDetailedSearch(query) {
    // Arama sayfasına yönlendir (gelecekte eklenebilir)
    saveSearchHistory(query);
    hideSearchDropdown();
    
    // Şimdilik list sayfasına yönlendir ve arama terimini ekle
    window.location.href = `list.html?search=${encodeURIComponent(query)}`;
}

function showSearchHistory() {
    const history = getSearchHistory();
    if (history.length === 0) return;

    const dropdown = document.querySelector('.search-dropdown');
    dropdown.innerHTML = `
        <div style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; color: #666; font-weight: 600;">
            Son Aramalar
        </div>
        ${history.map(term => `
            <div class="search-history-item" onclick="searchHistoryClick('${term}')" 
                 style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f5f5f5;">
                <i class="fas fa-history" style="color: #999; margin-right: 8px;"></i>
                ${term}
            </div>
        `).join('')}
        <div style="padding: 8px 12px; text-align: center;">
            <button onclick="clearSearchHistory()" style="background: none; border: none; color: #e30613; font-size: 12px; cursor: pointer;">
                Geçmişi Temizle
            </button>
        </div>
    `;
    
    showSearchDropdown();
}

function searchHistoryClick(term) {
    document.querySelector('.search-input').value = term;
    performSearch(term);
}

function saveSearchHistory(term) {
    let history = getSearchHistory();
    history = history.filter(item => item !== term); // Duplikat kaldır
    history.unshift(term); // En başa ekle
    history = history.slice(0, 5); // Max 5 öğe
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

function getSearchHistory() {
    try {
        return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    } catch {
        return [];
    }
}

function clearSearchHistory() {
    localStorage.removeItem('searchHistory');
    hideSearchDropdown();
}

function showSearchDropdown() {
    const dropdown = document.querySelector('.search-dropdown');
    if (dropdown) {
        dropdown.style.display = 'block';
    }
}

function hideSearchDropdown() {
    const dropdown = document.querySelector('.search-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function showSearchError(message) {
    const dropdown = document.querySelector('.search-dropdown');
    dropdown.innerHTML = `
        <div style="padding: 12px; text-align: center; color: #e30613;">
            <i class="fas fa-exclamation-triangle" style="margin-bottom: 8px;"></i><br>
            ${message}
        </div>
    `;
    showSearchDropdown();
}

/**
 * BİLDİRİM SİSTEMİ
 */
function initializeNotifications() {
    // Bildirim izni iste (eğer settings'de etkinse)
    const browserNotifications = localStorage.getItem('browser_notifications') === 'true';
    if (browserNotifications && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // İlk bildirim sayısını yükle
    loadNotificationCount();
}

async function loadNotificationCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${HEADER_API_URL}/notifications/unread-count`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateNotificationBadge(data.count || 0);
        } else {
            // Backend'de notifications endpoint yoksa applications'dan hesapla
            calculateNotificationCount();
        }
    } catch (error) {
        console.log('Bildirim API\'si kullanılamıyor, yerel hesaplama yapılıyor...');
        calculateNotificationCount();
    }
}

async function calculateNotificationCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${HEADER_API_URL}/applications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const applications = await response.json();
            const currentCount = applications.length;
            
            // Son kontrol edilen sayı ile karşılaştır
            const lastKnownCount = parseInt(localStorage.getItem('lastApplicationCount') || '0');
            
            if (currentCount > lastKnownCount) {
                const newNotifications = currentCount - lastKnownCount;
                notificationCount = Math.min(newNotifications, 99); // Max 99
                updateNotificationBadge(notificationCount);
                
                // Yeni başvuru bildirimi göster
                if (newNotifications > 0) {
                    showNewApplicationNotification(newNotifications);
                }
            }
            
            // Son uygulama sayısını güncelle
            localStorage.setItem('lastApplicationCount', currentCount.toString());
        }
    } catch (error) {
        console.error('Bildirim hesaplama hatası:', error);
        // Fallback: localStorage'dan son bilinen değeri kullan
        const savedCount = localStorage.getItem('notificationCount');
        if (savedCount) {
            updateNotificationBadge(parseInt(savedCount));
        }
    }
}

function updateNotificationBadge(count) {
    notificationCount = count;
    const badges = document.querySelectorAll('.notifications .badge');
    
    badges.forEach(badge => {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count.toString();
            badge.style.display = 'flex';
            
            // Yeni bildirim animasyonu
            badge.style.animation = 'none';
            badge.offsetHeight; // Reflow trigger
            badge.style.animation = 'notificationPulse 0.6s ease';
        } else {
            badge.style.display = 'none';
        }
    });
    
    // localStorage'a kaydet
    localStorage.setItem('notificationCount', count.toString());
}

function showNewApplicationNotification(count) {
    // Tarayıcı bildirimi
    const browserNotifications = localStorage.getItem('browser_notifications') === 'true';
    const soundNotifications = localStorage.getItem('sound_notifications') === 'true';
    
    if (browserNotifications && Notification.permission === 'granted') {
        const notification = new Notification('Guide of Dubai - Yeni Başvuru', {
            body: `${count} yeni başvuru alındı`,
            icon: 'assets/media/godlogo.png',
            badge: 'assets/media/godlogo.png',
            tag: 'new-application',
            requireInteraction: false
        });
        
        notification.onclick = function() {
            window.focus();
            window.location.href = 'list.html';
            notification.close();
        };
        
        // 5 saniye sonra otomatik kapat
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
    
    // Ses bildirimi
    if (soundNotifications) {
        playNotificationSound();
    }
    
    // In-app bildirim balonu
    showInAppNotification(`${count} yeni başvuru alındı`, 'success');
}

function playNotificationSound() {
    try {
        // Basit bildirim sesi (beep)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Ses bildirim çalınamadı:', error);
    }
}

function showInAppNotification(message, type = 'info') {
    // Mevcut notificationContainer'ı kullan veya oluştur
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const notificationId = 'notification-' + Date.now();
    const colors = {
        'success': { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
        'info': { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
        'warning': { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
        'error': { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' }
    };
    
    const color = colors[type] || colors['info'];
    
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.style.cssText = `
        background: ${color.bg};
        color: ${color.text};
        border: 1px solid ${color.border};
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 10px;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        pointer-events: auto;
        cursor: pointer;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-bell" style="color: ${color.text};"></i>
            <span>${message}</span>
            <button onclick="closeNotification('${notificationId}')" 
                    style="margin-left: auto; background: none; border: none; color: ${color.text}; cursor: pointer; padding: 0;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Bildirime tıklandığında list sayfasına git
    notification.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
            window.location.href = 'list.html';
        }
    });
    
    container.appendChild(notification);
    
    // Animasyon için küçük gecikme
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        closeNotification(notificationId);
    }, 5000);
}

function closeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

/**
 * REAL-TIME GÜNCELLEMELER
 */
function startNotificationPolling() {
    // Her 30 saniyede bir kontrol et
    notificationPollingInterval = setInterval(async () => {
        await loadNotificationCount();
        await checkStatusUpdates();
    }, 30000);
    
    console.log('Real-time bildirim sistemi başlatıldı');
}

async function checkStatusUpdates() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${HEADER_API_URL}/applications/recent-status-changes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const statusUpdates = await response.json();
            
            statusUpdates.forEach(update => {
                showStatusUpdateNotification(update);
            });
        }
    } catch (error) {
        // Status update API yoksa sessizce devam et
        console.log('Status update API kullanılamıyor');
    }
}

function showStatusUpdateNotification(update) {
    const statusTexts = {
        'approved': 'onaylandı',
        'rejected': 'reddedildi',
        'processing': 'işleme alındı',
        'cancelled': 'iptal edildi'
    };
    
    const statusText = statusTexts[update.status] || update.status;
    const message = `${update.ad} ${update.soyad} başvurusu ${statusText}`;
    
    // Tarayıcı bildirimi
    const browserNotifications = localStorage.getItem('browser_notifications') === 'true';
    if (browserNotifications && Notification.permission === 'granted') {
        const notification = new Notification('Guide of Dubai - Durum Güncellemesi', {
            body: message,
            icon: 'assets/media/godlogo.png',
            tag: `status-update-${update.id}`
        });
        
        notification.onclick = function() {
            window.focus();
            window.location.href = `application-details.html?id=${update.id}`;
            notification.close();
        };
    }
    
    // In-app bildirim
    showInAppNotification(message, 'info');
}

/**
 * YARDIMCI FONKSİYONLAR
 */
function getStatusText(status) {
    const statusMap = {
        'pending': 'Beklemede',
        'processing': 'İşleme Alındı',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi',
        'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || status;
}

// Bildirim animasyonu için CSS ekle
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes notificationPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    .notifications:hover .badge {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
    
    .search-dropdown {
        scrollbar-width: thin;
        scrollbar-color: #e30613 #f1f1f1;
    }
    
    .search-dropdown::-webkit-scrollbar {
        width: 6px;
    }
    
    .search-dropdown::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }
    
    .search-dropdown::-webkit-scrollbar-thumb {
        background: #e30613;
        border-radius: 3px;
    }
`;
document.head.appendChild(notificationStyles);

// Manuel bildirim sayısını sıfırlama fonksiyonu (gerektiğinde kullanılabilir)
window.clearNotifications = function() {
    updateNotificationBadge(0);
    localStorage.setItem('lastApplicationCount', '0');
}

// Manuel bildirim test fonksiyonu
window.testNotification = function() {
    showInAppNotification('Bu bir test bildirimidir!', 'success');
    
    if (Notification.permission === 'granted') {
        new Notification('Test Bildirimi', {
            body: 'Bildirim sistemi çalışıyor!',
            icon: 'assets/media/godlogo.png'
        });
    }
}