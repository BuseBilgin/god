// API Base URL - Backend URL'nizi buraya güncelleyin
const API_BASE_URL = 'https://god-1-lsu5.onrender.com';

// Password strength checker - İyileştirilmiş sade versiyon
function checkPasswordStrength(password) {
    const meter = document.getElementById('passwordStrengthMeter');
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');
    
    if (!password) {
        meter.style.display = 'none';
        return;
    }
    
    meter.style.display = 'block';
    
    let score = 0;
    
    // Uzunluk kontrolü
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Karakter türü kontrolü
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Tekrar eden karakter kontrolü
    if (!/(.)\1{2,}/.test(password)) score += 1;
    
    // Güç seviyesi belirleme
    let strength, width, className, percent;
    if (score <= 2) {
        strength = 'Zayıf';
        width = '25%';
        percent = '25%';
        className = 'strength-weak';
    } else if (score <= 4) {
        strength = 'Orta';
        width = '50%';
        percent = '50%';
        className = 'strength-fair';
    } else if (score <= 5) {
        strength = 'İyi';
        width = '75%';
        percent = '75%';
        className = 'strength-good';
    } else {
        strength = 'Güçlü';
        width = '100%';
        percent = '100%';
        className = 'strength-strong';
    }
    
    fill.style.width = width;
    fill.className = 'strength-fill';
    
    // Yeni HTML yapısı - daha temiz görünüm
    text.innerHTML = `
        <span class="strength-indicator">
            <span class="strength-dot"></span>
            <span>${strength}</span>
        </span>
        <span style="opacity: 0.7; font-size: 0.75rem;">${percent}</span>
    `;
    
    // Parent element'e class ekle - bu sayede renkler uygulanır
    meter.className = 'password-strength-meter ' + className;
}

// Password generator
function generatePassword() {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // En az bir karakter her gruptan
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Kalan karakterleri rastgele ekle
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Şifreyi karıştır
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    // Şifreyi input alanına yerleştir
    document.getElementById('newPassword').value = password;
    document.getElementById('confirmPassword').value = password;
    
    // Şifre gücünü kontrol et
    checkPasswordStrength(password);
    
    // Şifreyi geçici olarak göster
    const passwordInput = document.getElementById('newPassword');
    const confirmInput = document.getElementById('confirmPassword');
    const originalType1 = passwordInput.type;
    const originalType2 = confirmInput.type;
    
    passwordInput.type = 'text';
    confirmInput.type = 'text';
    
    // 3 saniye sonra gizle
    setTimeout(() => {
        passwordInput.type = originalType1;
        confirmInput.type = originalType2;
        updatePasswordToggleIcon('newPassword');
        updatePasswordToggleIcon('confirmPassword');
    }, 3000);
    
    showAlert('Güçlü şifre oluşturuldu! (3 saniye sonra gizlenecek)', 'success');
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'ToggleIcon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Update password toggle icon
function updatePasswordToggleIcon(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'ToggleIcon');
    
    if (input.type === 'password') {
        icon.className = 'fas fa-eye';
    } else {
        icon.className = 'fas fa-eye-slash';
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const toggleBtn = document.querySelector('.mobile-toggle i');
    
    if (mobileMenu.style.display === 'block') {
        mobileMenu.style.display = 'none';
        toggleBtn.className = 'fas fa-bars';
    } else {
        mobileMenu.style.display = 'block';
        toggleBtn.className = 'fas fa-times';
    }
}

// Alert function
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert" style="min-width: 300px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Sign out function
function signOut() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        window.location.href = 'sign-in.html';
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.ok) {
            const user = await response.json();
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('fullName').value = user.name || '';
            document.getElementById('phoneNumber').value = user.phone || '';
            document.getElementById('department').value = user.department || '';
            
            // Üstteki ismi güncelle
            const savedName = localStorage.getItem('userName');
            const displayName = savedName || user.name || user.email || 'Kullanıcı';
            document.getElementById('displayUserName').textContent = displayName;
            
        } else {
            // Fallback values
            const savedName = localStorage.getItem('userName');
            document.getElementById('displayUserName').textContent = savedName || 'Kullanıcı';
            document.getElementById('userEmail').value = 'user@example.com';
        }
    } catch (error) {
        console.error('Profile loading error:', error);
        const savedName = localStorage.getItem('userName');
        document.getElementById('displayUserName').textContent = savedName || 'Kullanıcı';
        showAlert('Profil bilgileri yüklenemedi', 'warning');
    }
}

// Load user preferences
async function loadUserPreferences() {
    // Load general preferences from localStorage
    document.getElementById('themeSelect').value = localStorage.getItem('theme') || 'light';
    document.getElementById('language').value = localStorage.getItem('language') || 'tr';
    document.getElementById('defaultPage').value = localStorage.getItem('defaultPage') || 'dashboard';
    document.getElementById('pageSize').value = localStorage.getItem('pageSize') || '50';
    
    // Load checkbox preferences
    document.getElementById('autoRefresh').checked = localStorage.getItem('autoRefresh') !== 'false';
    document.getElementById('showPreview').checked = localStorage.getItem('showPreview') !== 'false';
    
    // Load notification settings
    await loadNotificationSettings();
}

// Load notification settings
async function loadNotificationSettings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/notification-settings`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (response.ok) {
            const settings = await response.json();
            document.getElementById('emailNewApplication').checked = settings.email_new_application !== false;
            document.getElementById('emailStatusUpdate').checked = settings.email_status_update !== false;
            document.getElementById('emailSystemUpdate').checked = settings.email_system_update || false;
            document.getElementById('emailWeeklyReport').checked = settings.email_weekly_report !== false;
            document.getElementById('browserNotifications').checked = settings.browser_notifications || false;
            document.getElementById('soundNotifications').checked = settings.sound_notifications || false;
        } else {
            loadNotificationSettingsFromLocal();
        }
    } catch (error) {
        console.error('Notification settings loading error:', error);
        loadNotificationSettingsFromLocal();
    }
}

// Load notification settings from localStorage
function loadNotificationSettingsFromLocal() {
    document.getElementById('emailNewApplication').checked = localStorage.getItem('email_new_application') !== 'false';
    document.getElementById('emailStatusUpdate').checked = localStorage.getItem('email_status_update') !== 'false';
    document.getElementById('emailSystemUpdate').checked = localStorage.getItem('email_system_update') === 'true';
    document.getElementById('emailWeeklyReport').checked = localStorage.getItem('email_weekly_report') !== 'false';
    document.getElementById('browserNotifications').checked = localStorage.getItem('browser_notifications') === 'true';
    document.getElementById('soundNotifications').checked = localStorage.getItem('sound_notifications') === 'true';
}

// Save preferences
function savePreferences() {
    localStorage.setItem('theme', document.getElementById('themeSelect').value);
    localStorage.setItem('language', document.getElementById('language').value);
    localStorage.setItem('defaultPage', document.getElementById('defaultPage').value);
    localStorage.setItem('pageSize', document.getElementById('pageSize').value);
    localStorage.setItem('autoRefresh', document.getElementById('autoRefresh').checked);
    localStorage.setItem('showPreview', document.getElementById('showPreview').checked);
    
    showAlert('Tercihleriniz kaydedildi!', 'success');
}

// Save notification settings
async function saveNotificationSettings() {
    const notificationSettings = {
        email_new_application: document.getElementById('emailNewApplication').checked,
        email_status_update: document.getElementById('emailStatusUpdate').checked,
        email_system_update: document.getElementById('emailSystemUpdate').checked,
        email_weekly_report: document.getElementById('emailWeeklyReport').checked,
        browser_notifications: document.getElementById('browserNotifications').checked,
        sound_notifications: document.getElementById('soundNotifications').checked
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/notification-settings`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationSettings)
        });

        if (response.ok) {
            if (notificationSettings.browser_notifications) {
                await requestNotificationPermission();
            }
            
            Object.keys(notificationSettings).forEach(key => {
                localStorage.setItem(key, notificationSettings[key]);
            });
            
            showAlert('Bildirim ayarları başarıyla kaydedildi!', 'success');
        } else {
            throw new Error('Failed to save notification settings');
        }
    } catch (error) {
        console.error('Notification settings error:', error);
        
        Object.keys(notificationSettings).forEach(key => {
            localStorage.setItem(key, notificationSettings[key]);
        });
        
        showAlert('Bildirim ayarları kaydedildi (yalnızca yerel)', 'warning');
    }
}

// Request notification permission
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        showAlert('Bu tarayıcı bildirim desteği sunmuyor', 'warning');
        return false;
    }

    if (Notification.permission === 'denied') {
        showAlert('Bildirimler engellenmiş. Tarayıcı ayarlarından izin verin.', 'warning');
        return false;
    }

    if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            showAlert('Tarayıcı bildirimleri etkinleştirildi!', 'success');
            
            new Notification('Guide of Dubai', {
                body: 'Bildirimler başarıyla etkinleştirildi!',
                icon: 'assets/media/godlogo.png'
            });
            
            return true;
        } else {
            showAlert('Bildirim izni reddedildi', 'danger');
            document.getElementById('browserNotifications').checked = false;
            return false;
        }
    }

    return true;
}

// Send test notification
function sendTestNotification() {
    if (Notification.permission === 'granted') {
        new Notification('Test Bildirimi', {
            body: 'Bu bir test bildirimidir. Bildirimler çalışıyor!',
            icon: 'assets/media/godlogo.png'
        });
        showAlert('Test bildirimi gönderildi!', 'success');
    } else {
        showAlert('Önce tarayıcı bildirimlerini etkinleştirin', 'warning');
    }
}

// Session management functions
function refreshSessions() {
    showAlert('Oturum bilgileri yenilendi!', 'success');
    // Session refresh functionality would go here
}

function logoutAllSessions() {
    if (confirm('Tüm oturumlar sonlandırılsın mı? Bu işlem diğer cihazlardaki oturumları da kapatacaktır.')) {
        showAlert('Tüm oturumlar sonlandırıldı!', 'success');
        setTimeout(() => {
            signOut();
        }, 2000);
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert('Giriş yapılmamış. Giriş sayfasına yönlendiriliyorsunuz.', 'danger');
        setTimeout(() => {
            window.location.href = 'sign-in.html';
        }, 2000);
        return;
    }

    // Load user data
    loadUserProfile();
    loadUserPreferences();
    
    // Şifre gücü göstergesini başlangıçta gizle
    const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
    if (passwordStrengthMeter) {
        passwordStrengthMeter.style.display = 'none';
        passwordStrengthMeter.className = 'password-strength-meter';
        const strengthFill = document.getElementById('strengthFill');
        if (strengthFill) {
            strengthFill.style.width = '0%';
            strengthFill.className = 'strength-fill';
        }
        const strengthText = document.getElementById('strengthText');
        if (strengthText) {
            strengthText.innerHTML = `
                <span class="strength-indicator">
                    <span class="strength-dot"></span>
                    <span>Şifre Gücü</span>
                </span>
                <span style="opacity: 0.7; font-size: 0.75rem;">0%</span>
            `;
        }
    }
    
    // Settings navigation
    document.querySelectorAll('.settings-nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active from all links
            document.querySelectorAll('.settings-nav-link').forEach(l => l.classList.remove('active'));
            // Add active to clicked link
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.settings-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            const targetSection = this.dataset.section;
            document.getElementById(targetSection + '-section').classList.add('active');
        });
    });
    
    // Browser notifications checkbox listener
    document.getElementById('browserNotifications').addEventListener('change', function(e) {
        if (e.target.checked) {
            requestNotificationPermission().then(granted => {
                if (!granted) {
                    e.target.checked = false;
                }
            });
        }
    });

    // Password strength checker
    document.getElementById('newPassword').addEventListener('input', function(e) {
        checkPasswordStrength(e.target.value);
    });

    // Profile form submit
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const phoneNumber = document.getElementById('phoneNumber').value.trim();
        const department = document.getElementById('department').value;

        if (!fullName) {
            showAlert('Ad soyad alanı boş bırakılamaz!', 'danger');
            return;
        }

        const formData = {
            name: fullName,
            phone: phoneNumber,
            department: department
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                document.getElementById('displayUserName').textContent = fullName;
                localStorage.setItem('userName', fullName);
                showAlert('Profil bilgileri başarıyla güncellendi!', 'success');
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showAlert('Profil güncellenirken hata oluştu', 'danger');
        }
    });

    // Password form submit
    document.getElementById('passwordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation checks
        if (!currentPassword) {
            showAlert('Mevcut şifrenizi girmelisiniz!', 'danger');
            return;
        }

        if (!newPassword) {
            showAlert('Yeni şifrenizi girmelisiniz!', 'danger');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Yeni şifreler eşleşmiyor!', 'danger');
            return;
        }

        if (newPassword.length < 8) {
            showAlert('Yeni şifre en az 8 karakter olmalıdır!', 'danger');
            return;
        }

        // Check password strength
        const strengthText = document.getElementById('strengthText');
        const strengthIndicator = strengthText ? strengthText.querySelector('.strength-indicator span:last-child') : null;
        if (strengthIndicator && strengthIndicator.textContent.includes('Zayıf')) {
            if (!confirm('Şifreniz zayıf görünüyor. Yine de devam etmek istiyor musunuz?')) {
                return;
            }
        }

        if (currentPassword === newPassword) {
            showAlert('Yeni şifre mevcut şifreden farklı olmalıdır!', 'danger');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            if (response.ok) {
                showAlert('Şifre başarıyla değiştirildi!', 'success');
                document.getElementById('passwordForm').reset();
                
                // Reset password strength meter
                const passwordStrengthMeter = document.getElementById('passwordStrengthMeter');
                if (passwordStrengthMeter) {
                    passwordStrengthMeter.style.display = 'none';
                    passwordStrengthMeter.className = 'password-strength-meter';
                    const strengthFill = document.getElementById('strengthFill');
                    if (strengthFill) {
                        strengthFill.style.width = '0%';
                        strengthFill.className = 'strength-fill';
                    }
                    const strengthText = document.getElementById('strengthText');
                    if (strengthText) {
                        strengthText.innerHTML = `
                            <span class="strength-indicator">
                                <span class="strength-dot"></span>
                                <span>Şifre Gücü</span>
                            </span>
                            <span style="opacity: 0.7; font-size: 0.75rem;">0%</span>
                        `;
                    }
                }
                
                // Reset password visibility icons
                document.getElementById('currentPasswordToggleIcon').className = 'fas fa-eye';
                document.getElementById('newPasswordToggleIcon').className = 'fas fa-eye';
                document.getElementById('confirmPasswordToggleIcon').className = 'fas fa-eye';
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Password change failed');
            }
        } catch (error) {
            console.error('Password change error:', error);
            showAlert(error.message || 'Şifre değiştirilirken hata oluştu', 'danger');
        }
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const header = document.querySelector('.header');
    
    if (!header.contains(event.target) && mobileMenu.style.display === 'block') {
        mobileMenu.style.display = 'none';
        document.querySelector('.mobile-toggle i').className = 'fas fa-bars';
    }
});