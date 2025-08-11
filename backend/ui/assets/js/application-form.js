let personCount = 0;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    addPerson();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token) {
        // Redirect to login if no token
        if (confirm('Bu sayfaya erişmek için giriş yapmanız gerekiyor. Giriş sayfasına yönlendirilmek ister misiniz?')) {
            window.location.href = 'sign-in.html';
        }
        return false;
    }
    
    // Validate token with backend
    fetch('/me', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            // Token is invalid
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            if (confirm('Oturum süreniz dolmuş. Giriş sayfasına yönlendirilmek ister misiniz?')) {
                window.location.href = 'sign-in.html';
            }
            return false;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            console.log('Authenticated user:', data);
            // Update localStorage with fresh data
            localStorage.setItem('userRole', data.role);
        }
    })
    .catch(error => {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
    });
    
    return true;
}

const API_BASE_URL = 'https://god-1-lsu5.onrender.com';

// Navigation functions - Header ile uyumlu
function goToApplications() {
    window.location.href = 'list.html';
}

function signOut() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        // Clear any stored user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        
        // Redirect to sign-in page
        window.location.href = 'sign-in.html';
    }
}

function addPerson() {
    personCount++;
    const container = document.getElementById('personsContainer');
    
    const personDiv = document.createElement('div');
    personDiv.className = 'person-section';
    personDiv.id = `person-${personCount}`;
    
    personDiv.innerHTML = `
        ${personCount > 1 ? `<button type="button" class="delete-person-btn" onclick="deletePerson(${personCount})">Delete This Person</button>` : ''}
        
        <!-- File Upload Grid -->
        <div class="file-upload-grid">
            <div class="file-upload-item">
                <label class="file-upload-label">
                    Passport Photo 
                    <span class="question-icon" title="Upload passport photo">?</span>
                </label>
                <label for="passport-${personCount}" class="file-upload-area">
                    <div class="upload-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                    </div>
                    <div class="upload-text">Click to upload</div>
                    <input type="file" id="passport-${personCount}" name="passport[]" accept="image/*,.pdf" onchange="handleFileUpload(this)">
                </label>
            </div>
            
            <div class="file-upload-item">
                <label class="file-upload-label">Biometric Photo</label>
                <label for="biometric-${personCount}" class="file-upload-area">
                    <div class="upload-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div class="upload-text">Click to upload</div>
                    <input type="file" id="biometric-${personCount}" name="biometric_photo[]" accept="image/*" onchange="handleFileUpload(this)">
                </label>
            </div>
            
            <div class="file-upload-item">
                <label class="file-upload-label">Hotel Reservation</label>
                <label for="hotel-${personCount}" class="file-upload-area">
                    <div class="upload-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                    </div>
                    <div class="upload-text">Click to upload</div>
                    <input type="file" id="hotel-${personCount}" name="hotel_reservation[]" accept=".pdf,.jpg,.jpeg,.png" onchange="handleFileUpload(this)">
                </label>
            </div>
            
            <div class="file-upload-item">
                <label class="file-upload-label">Flight Ticket</label>
                <label for="flight-${personCount}" class="file-upload-area">
                    <div class="upload-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                    </div>
                    <div class="upload-text">Click to upload</div>
                    <input type="file" id="flight-${personCount}" name="flight_ticket[]" accept=".pdf,.jpg,.jpeg,.png" onchange="handleFileUpload(this)">
                </label>
            </div>
        </div>

        <!-- Form Fields -->
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" name="fullname[]" placeholder="Full Name" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Application Type</label>
                <select class="form-control" name="application_type[]" required>
                    <option value="Adult">Adult</option>
                    <option value="Child">Child</option>
                    <option value="Infant">Infant</option>
                </select>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-control" name="email[]" placeholder="Email Address" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Phone Number</label>
                <div class="phone-wrapper">
                    <input type="tel" class="form-control phone-input" name="phone[]" placeholder="Phone Number" required>
                </div>
            </div>
        </div>

        <div class="form-row-triple">
            <div class="form-group">
                <label class="form-label">Visa Type</label>
                <select class="form-control" name="visa_type[]" required onchange="updatePrice()">
                    <option value="30 days single entry ($125)">30 days single entry ($125)</option>
                    <option value="30 days multiple entry ($350)">30 days multiple entry ($350)</option>
                    <option value="90 days single entry ($350)">90 days single entry ($350)</option>
                    <option value="90 days multiple entry ($700)">90 days multiple entry ($700)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Express Service</label>
                <select class="form-control" name="express[]">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Insurance</label>
                <select class="form-control" name="insurance[]">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
            </div>
        </div>
    `;
    
    container.appendChild(personDiv);
    updatePrice();
}

function deletePerson(personId) {
    const personSection = document.getElementById(`person-${personId}`);
    if (personSection) {
        personSection.remove();
        updatePrice();
    }
}

function handleFileUpload(input) {
    const uploadArea = input.closest('.file-upload-area') || input.parentElement;
    const uploadText = uploadArea.querySelector('.upload-text');
    const uploadIcon = uploadArea.querySelector('.upload-icon');
    
    if (input.files.length > 0) {
        const file = input.files[0];
        const fileName = file.name;
        const fileSize = (file.size / 1024).toFixed(1); // KB
        
        uploadArea.classList.add('has-file');
        
        // Check if file is an image
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create preview container
                const previewContainer = document.createElement('div');
                previewContainer.className = 'preview-container';
                previewContainer.onclick = () => openImageModal(e.target.result);
                
                // Create preview image
                const previewImg = document.createElement('img');
                previewImg.src = e.target.result;
                previewImg.className = 'file-preview';
                previewImg.alt = fileName;
                
                // Create overlay
                const overlay = document.createElement('div');
                overlay.className = 'preview-overlay';
                overlay.innerHTML = '<i class="fas fa-expand"></i>';
                
                previewContainer.appendChild(previewImg);
                previewContainer.appendChild(overlay);
                
                // Replace upload content with preview
                uploadArea.innerHTML = '';
                uploadArea.appendChild(previewContainer);
                uploadArea.appendChild(input); // Keep the input for form submission
                
                console.log(`Image uploaded: ${fileName} (${fileSize} KB)`);
            };
            reader.readAsDataURL(file);
        } else {
            // For non-image files (like PDFs), show file info
            uploadIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>';
            uploadText.innerHTML = `<strong>✓ ${fileName}</strong><br><small>${fileSize} KB</small>`;
            uploadText.style.color = '#28a745';
            
            console.log(`File uploaded: ${fileName} (${fileSize} KB)`);
        }
    } else {
        uploadArea.classList.remove('has-file');
        
        // Reset to original state
        const originalContent = getOriginalUploadContent(uploadArea);
        uploadArea.innerHTML = originalContent;
        
        // Re-attach the input event
        const newInput = uploadArea.querySelector('input[type="file"]');
        if (newInput) {
            newInput.onchange = () => handleFileUpload(newInput);
        }
    }
}

function getOriginalUploadContent(uploadArea) {
    // Get the input attributes to recreate it
    const input = uploadArea.querySelector('input[type="file"]');
    const inputId = input ? input.id : '';
    const inputName = input ? input.name : '';
    const inputAccept = input ? input.accept : '';
    
    // Determine icon based on the label text
    const label = uploadArea.closest('.file-upload-item').querySelector('.file-upload-label').textContent;
    let iconSvg = '';
    
    if (label.includes('Passport')) {
        iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>';
    } else if (label.includes('Biometric')) {
        iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    } else if (label.includes('Hotel')) {
        iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>';
    } else if (label.includes('Flight')) {
        iconSvg = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>';
    }
    
    return `
        <div class="upload-icon">${iconSvg}</div>
        <div class="upload-text">Click to upload</div>
        <input type="file" id="${inputId}" name="${inputName}" accept="${inputAccept}" onchange="handleFileUpload(this)">
    `;
}

// Modal functions
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    
    modal.classList.add('show');
    modalImg.src = imageSrc;
    
    // Close modal when clicking outside the image
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeImageModal();
        }
    };
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeImageModal();
        }
    });
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
}

function updatePrice() {
    const sections = document.querySelectorAll('.person-section');
    let totalPrice = 0;
    
    sections.forEach(section => {
        const visaSelect = section.querySelector('select[name="visa_type[]"]');
        if (visaSelect && visaSelect.value) {
            const priceMatch = visaSelect.value.match(/\$(\d+)/);
            if (priceMatch) {
                totalPrice += parseInt(priceMatch[1]);
            }
        }
    });
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = `APPLY`;
}

// Form submission - ÇOK ÖNEMLİ: DOSYALAR İLE BİRLİKTE GÖNDERME
document.getElementById('applicationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const successAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');
    
    // Hide alerts
    successAlert.style.display = 'none';
    errorAlert.style.display = 'none';
    
    // Show loading
    submitBtn.disabled = true;
    loading.classList.add('show');
    
    try {
        // Check authentication first
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Giriş yapmanız gerekiyor. Lütfen önce giriş yapın.');
        }
        
        // Collect all form data with files
        const personSections = document.querySelectorAll('.person-section');
        
        if (personSections.length === 0) {
            throw new Error('En az bir kişi için bilgi girilmelidir.');
        }
        
        // Her kişi için ayrı FormData oluştur ve gönder
        const results = [];
        
        for (let i = 0; i < personSections.length; i++) {
            const section = personSections[i];
            const formData = new FormData();
            
            // Kişisel bilgileri ekle
            const fullname = section.querySelector('input[name="fullname[]"]').value.trim();
            const email = section.querySelector('input[name="email[]"]').value.trim();
            const phone = section.querySelector('input[name="phone[]"]').value.trim();
            const visa_type = section.querySelector('select[name="visa_type[]"]').value;
            const application_type = section.querySelector('select[name="application_type[]"]').value;
            const express = section.querySelector('select[name="express[]"]').value;
            const insurance = section.querySelector('select[name="insurance[]"]').value;
            
            // Zorunlu alan kontrolleri
            if (!fullname) {
                throw new Error(`${i + 1}. kişi için isim soyisim gereklidir.`);
            }
            if (!email) {
                throw new Error(`${i + 1}. kişi için email gereklidir.`);
            }
            if (!phone) {
                throw new Error(`${i + 1}. kişi için telefon gereklidir.`);
            }
            
            // Full name'i ad ve soyad'a böl
            const nameParts = fullname.split(' ');
            const ad = nameParts[0] || '';
            const soyad = nameParts.slice(1).join(' ') || '';
            
            // Form verilerini ekle
            formData.append('ad', ad);
            formData.append('soyad', soyad);
            formData.append('email', email);
            formData.append('telefon', phone);
            formData.append('vize_tipi', visa_type);
            formData.append('vize_giris', application_type);
            formData.append('express', express);
            formData.append('sigorta', insurance);
            
            // Dosyaları ekle
            const passportFile = section.querySelector('input[name="passport[]"]').files[0];
            const biometricFile = section.querySelector('input[name="biometric_photo[]"]').files[0];
            const hotelFile = section.querySelector('input[name="hotel_reservation[]"]').files[0];
            const flightFile = section.querySelector('input[name="flight_ticket[]"]').files[0];
            
            if (passportFile) {
                formData.append('passport', passportFile);
                console.log('Passport file added:', passportFile.name);
            }
            if (biometricFile) {
                formData.append('biometric_photo', biometricFile);
                console.log('Biometric file added:', biometricFile.name);
            }
            if (hotelFile) {
                formData.append('hotel_reservation', hotelFile);
                console.log('Hotel file added:', hotelFile.name);
            }
            if (flightFile) {
                formData.append('flight_ticket', flightFile);
                console.log('Flight file added:', flightFile.name);
            }
            
            // Debug: FormData içeriğini logla
            console.log(`Person ${i + 1} FormData contents:`);
            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
            }
            
            // Backend'e gönder - ÖNEMLİ: Content-Type header'ı EKLEMEYİN!
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: formData // FormData nesnesini doğrudan gönder
            });
            
            console.log(`Person ${i + 1} response status:`, response.status);
            
            let result;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                result = await response.text();
            }
            
            if (!response.ok) {
                console.error(`Person ${i + 1} server response:`, result);
                
                let errorMessage = `${i + 1}. kişi için başvuru gönderilirken hata oluştu.`;
                
                if (response.status === 403) {
                    errorMessage = `Yetkisiz erişim (403) - ${i + 1}. kişi için.`;
                } else if (response.status === 401) {
                    errorMessage = 'Kimlik doğrulama başarısız. Tekrar giriş yapın.';
                    localStorage.removeItem('token');
                    localStorage.removeItem('userRole');
                    setTimeout(() => {
                        window.location.href = 'sign-in.html';
                    }, 2000);
                } else if (response.status === 500) {
                    errorMessage = `Sunucu hatası - ${i + 1}. kişi için.`;
                } else if (response.status === 400) {
                    errorMessage = `Geçersiz veri - ${i + 1}. kişi: ` + (result.message || result);
                }
                
                throw new Error(errorMessage);
            }
            
            results.push(result);
            console.log(`Person ${i + 1} success:`, result);
        }
        
        // Tüm başvurular başarılı
        successAlert.innerHTML = `
            <strong>Başarılı!</strong> ${personSections.length} başvuru dosyalarla birlikte başarıyla gönderildi!<br>
            <small class="text-muted"></small>
        `;
        successAlert.style.display = 'block';
        
        // Reset form
        document.getElementById('personsContainer').innerHTML = '';
        personCount = 0;
        addPerson();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Application submission error:', error);
        
        errorAlert.innerHTML = `
            <strong>Hata!</strong><br>
            ${error.message}<br><br>
            <small class="text-muted">
                Dosya yükleme problemi varsa, backend'inizin multipart/form-data 
                desteklediğinden ve dosya upload middleware'inin çalıştığından emin olun.
            </small>
        `;
        errorAlert.style.display = 'block';
        
        // Scroll to error message
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
    } finally {
        submitBtn.disabled = false;
        loading.classList.remove('show');
    }
});

// Initialize price on page load
setTimeout(updatePrice, 100);