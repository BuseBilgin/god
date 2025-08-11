"use strict";

// API base URL - backend'inizin adresi
const API_BASE_URL = 'http://localhost:8080';

// Durum çevirisi için yardımcı fonksiyon
function getStatusText(status) {
    const statusMap = {
        'pending': 'Beklemede',
        'processing': 'İşleniyor',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi',
        'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || status;
}

// Token kontrol fonksiyonu
function checkAuthToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Giriş Gerekli',
            text: 'Bu sayfaya erişmek için giriş yapmanız gerekiyor.',
            confirmButtonText: 'Giriş Yap'
        }).then(() => {
            window.location.href = '/sign-in.html';
        });
        return false;
    }
    return true;
}

// URL parametrelerini parse etme fonksiyonu
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// API çağrısı için yardımcı fonksiyon
function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    return fetch(API_BASE_URL + url, mergedOptions);
}

var KTApplicationsList = (function () {
    window.table = null;

    return {
        init: function () {
            // Token kontrolü yap
            if (!checkAuthToken()) {
                return;
            }

            const element = document.querySelector("#kt_customers_table");
            if (!element) return;

            window.table = $(element).DataTable ({
                ajax: {
                    url: API_BASE_URL + "/applications",
                    dataSrc: "",
                    beforeSend: function (xhr) {
                        const token = localStorage.getItem("token");
                        if (token) {
                            xhr.setRequestHeader("Authorization", "Bearer " + token);
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        console.error('DataTable Error:', xhr, textStatus, errorThrown);
                        
                        if (xhr.status === 401) {
                            Swal.fire({
                                icon: "error",
                                title: "Oturum Süresi Dolmuş",
                                text: "Lütfen tekrar giriş yapın.",
                                showConfirmButton: true
                            }).then(() => {
                                localStorage.removeItem('token');
                                window.location.href = '/sign-in.html';
                            });
                        } else {
                            Swal.fire({
                                icon: "error",
                                title: "Bağlantı Hatası",
                                text: "Backend sunucusuna bağlanılamadı. Sunucunun çalıştığından emin olun."
                            });
                        }
                    }
                },
                dom: 'Brt<"d-flex justify-content-between align-items-center mt-3"<"d-flex align-items-center"i><"pagination-wrapper"p>>',
                responsive: {
                    details: {
                        type: 'column',
                        target: 'tr'
                    }
                },
                buttons: [
                    {
                        extend: 'copy',
                        text: 'Kopyala',
                        className: 'btn btn-red'
                    },
                    {
                        extend: 'excel',
                        text: 'Excel',
                        className: 'btn btn-red'
                    },
                    {
                        extend: 'csv',
                        text: 'CSV',
                        className: 'btn btn-red'
                    },
                    {
                        extend: 'pdf',
                        text: 'PDF',
                        className: 'btn btn-red'
                    }
                ],
                language: {
                    "processing": "İşleniyor...",
                    "lengthMenu": "_MENU_ kayıt göster",
                    "zeroRecords": "Eşleşen kayıt bulunamadı",
                    "info": "_TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor",
                    "infoEmpty": "0 kayıttan 0 - 0 arası gösteriliyor",
                    "infoFiltered": "(_MAX_ kayıt içerisinden bulunan)",
                    "search": "Ara:",
                    "paginate": {
                        "first": "İlk",
                        "last": "Son",
                        "next": "",
                        "previous": ""
                    }
                },
                columns: [
                    { 
                        title: "Kimlik", 
                        data: "id",
                        className: "text-center",
                        responsivePriority: 1,
                        render: function(data, type, row) {
                            return `<span class="clickable-cell" onclick="viewApplication(${row.id})">${row.id}</span>`;
                        }
                    },
                    { 
                        title: "İsim Soyisim", 
                        data: null,
                        responsivePriority: 2,
                        render: function(data, type, row) {
                            return `<span class="clickable-cell" onclick="viewApplication(${row.id})">${row.ad} ${row.soyad}</span>`;
                        }
                    },
                    { 
                        title: "E-Posta Adresi", 
                        data: "email",
                        responsivePriority: 4
                    },
                    { 
                        title: "Telefon Numarası", 
                        data: "telefon",
                        responsivePriority: 5
                    },
                    {
                        title: "Pasaport Fotoğrafı",
                        data: "passport",
                        className: "text-center",
                        responsivePriority: 3,
                        render: function(data, type, row) {
                            if (!data || data.trim() === '') {
                                return '<span class="text-muted">Dosya Yok</span>';
                            }
                            
                            return `
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="button" class="btn btn-sm btn-primary" onclick="downloadFile('${data}')" title="İndir">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-info" onclick="previewImage('${data}')" title="Görüntüle">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            `;
                        }
                    },
                    {
                        title: "Biyometrik Fotoğraf",
                        data: "biometric_photo",
                        className: "text-center",
                        responsivePriority: 4,
                        render: function(data, type, row) {
                            if (!data || data.trim() === '') {
                                return '<span class="text-muted">Dosya Yok</span>';
                            }
                            
                            return `
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="button" class="btn btn-sm btn-primary" onclick="downloadFile('${data}')" title="İndir">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-info" onclick="previewImage('${data}')" title="Görüntüle">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            `;
                        }
                    },
                    
                    // Gizli sütunlar
                    { 
                        title: "Vize Tipi", 
                        data: "vize_tipi",
                        visible: false,
                        responsivePriority: 6
                    },
                    { 
                        title: "Vize Giriş", 
                        data: "vize_giris",
                        visible: false,
                        responsivePriority: 7
                    },
                    { 
                        title: "Express", 
                        data: "express",
                        className: "text-center",
                        visible: false,
                        responsivePriority: 8
                    },
                    { 
                        title: "Sigorta", 
                        data: "sigorta",
                        className: "text-center",
                        visible: false,
                        responsivePriority: 9
                    },
                    {
                        title: "Durum",
                        data: "status",
                        className: "text-center",
                        visible: false,
                        responsivePriority: 10,
                        render: function(data, type, row) {
                            return `<span class="status-badge status-${data}">${getStatusText(data)}</span>`;
                        }
                    },
                    {
                        title: "Otel Rezervasyonu",
                        data: "hotel_reservation",
                        className: "text-center",
                        visible: false,
                        responsivePriority: 11,
                        render: function(data, type, row) {
                            if (!data) return '<span class="text-muted">Dosya Yok</span>';
                            return `
                                <button class="btn btn-sm btn-primary" onclick="downloadFile('${data}')" title="İndir">
                                    <i class="fas fa-download"></i>
                                </button>
                            `;
                        }
                    },
                    {
                        title: "Uçak Bileti",
                        data: "flight_ticket",
                        className: "text-center",
                        visible: false,
                        responsivePriority: 12,
                        render: function(data, type, row) {
                            if (!data) return '<span class="text-muted">Dosya Yok</span>';
                            return `
                                <button class="btn btn-sm btn-primary" onclick="downloadFile('${data}')" title="İndir">
                                    <i class="fas fa-download"></i>
                                </button>
                            `;
                        }
                    }
                ],
                pageLength: 10,
                lengthChange: true,
                searching: true,
                paging: true,
                info: true,
                order: [[0, 'desc']],
                initComplete: function () {
                    // Export butonlarını custom container'a taşı
                    $('.dt-buttons').appendTo('#custom-buttons-container');

                    // Pagination'ı Metronic stiline çevir - Her draw'da çalıştır
                    this.api().on('draw', function () {
                        setTimeout(function() {
                            customizePagination();
                        }, 50);
                    });
                    
                    // İlk yükleme için de çalıştır
                    setTimeout(function() {
                        customizePagination();
                    }, 100);

                    // Sütun görünürlüğü dropdown'unu doldur
                    var api = this.api();
                    var dropdown = $("#columnVisibilityDropdown").empty();

                    api.columns().every(function (i) {
                        var column = api.column(i);
                        var columnTitle = $(column.header()).text();
                        var isVisible = column.visible();
                        
                        if (columnTitle !== "İşlemler") {
                            dropdown.append(`
                                <li>
                                    <label>
                                        <input type="checkbox" data-column="${i}" ${isVisible ? 'checked' : ''}>
                                        ${columnTitle}
                                    </label>
                                </li>
                            `);
                        }
                    });

                    // Sütun görünürlüğü toggle
                    dropdown.on("change", "input[type='checkbox']", function () {
                        var column = table.column($(this).data("column"));
                        column.visible($(this).is(":checked"));
                        table.responsive.recalc();
                        // Pagination'ı tekrar customize et
                        setTimeout(function() {
                            customizePagination();
                        }, 50);
                    });

                    // URL'den arama parametresini kontrol et ve uygula
                    const searchParam = getUrlParameter('search');
                    if (searchParam) {
                        // Custom search box'a arama terimini yaz
                        $('#customSearchBox').val(decodeURIComponent(searchParam));
                        // DataTable'da aramayı uygula
                        table.search(decodeURIComponent(searchParam)).draw();
                        
                        // Kullanıcıya bildirim göster
                        setTimeout(() => {
                            Swal.fire({
                                icon: 'info',
                                title: 'Arama Sonuçları',
                                text: `"${decodeURIComponent(searchParam)}" için arama yapıldı`,
                                timer: 2000,
                                timerProgressBar: true,
                                showConfirmButton: false,
                                position: 'top-end',
                                toast: true
                            });
                        }, 500);
                        
                        // URL'i temizle (back/forward navigation'ı etkilemesin)
                        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                        window.history.replaceState({ path: newUrl }, '', newUrl);
                    }
                }
            });

            // Custom arama kutusu
            $('#customSearchBox').on('keyup', function () {
                table.search(this.value).draw();
            });

            // Custom entries count
            $('#entriesCount').on('change', function () {
                table.page.len(parseInt(this.value)).draw();
            });
        }
    };
})();


// Pagination'ı Metronic stiline çevirme fonksiyonu - Tamamen yeniden yazıldı ve ortalama eklendi
function customizePagination() {
    // Pagination wrapper'ı kontrol et
    let $paginateWrapper = $('.dataTables_paginate');
    if ($paginateWrapper.length === 0) return;
    
    // Mevcut pagination structure'ını temizle
    $paginateWrapper.find('.pagination').remove();
    
    // Yeni pagination yapısını oluştur
    let $pagination = $('<ul class="pagination pagination-outline mb-0"></ul>');
    
    // DataTables pagination bilgilerini al
    let info = table.page.info();
    let currentPage = info.page + 1; // DataTables 0-based, bizim pagination 1-based
    let totalPages = info.pages;
    
    // Previous button
    let prevClass = currentPage === 1 ? 'disabled' : '';
    $pagination.append(`
        <li class="page-item previous ${prevClass}">
            <a class="page-link" href="#" data-page="${currentPage - 2}">
                <i class="previous"></i>
            </a>
        </li>
    `);
    
    // Sayfa numaralarını hesapla
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // İlk sayfa her zaman gösterilsin
    if (startPage > 1) {
        $pagination.append(`
            <li class="page-item">
                <a class="page-link" href="#" data-page="0">1</a>
            </li>
        `);
        
        if (startPage > 2) {
            $pagination.append(`
                <li class="page-item disabled">
                    <a class="page-link">...</a>
                </li>
            `);
        }
    }
    
    // Orta sayfa numaraları
    for (let i = startPage; i <= endPage; i++) {
        let activeClass = i === currentPage ? 'active' : '';
        $pagination.append(`
            <li class="page-item ${activeClass}">
                <a class="page-link" href="#" data-page="${i - 1}">${i}</a>
            </li>
        `);
    }
    
    // Son sayfa
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            $pagination.append(`
                <li class="page-item disabled">
                    <a class="page-link">...</a>
                </li>
            `);
        }
        
        $pagination.append(`
            <li class="page-item">
                <a class="page-link" href="#" data-page="${totalPages - 1}">${totalPages}</a>
            </li>
        `);
    }
    
    // Next button
    let nextClass = currentPage === totalPages ? 'disabled' : '';
    $pagination.append(`
        <li class="page-item next ${nextClass}">
            <a class="page-link" href="#" data-page="${currentPage}">
                <i class="next"></i>
            </a>
        </li>
    `);
    
    // Pagination'ı wrapper'a ekle
    $paginateWrapper.html($pagination);
    
    // ORTALAMA İÇİN EK DÜZENLEMELER
    $paginateWrapper.css({
        'display': 'block',
        'width': '100%',
        'text-align': 'center',
        'margin': '2rem 0 0 0',
        'float': 'none',
        'position': 'relative',
        'left': '0',
        'right': '0'
    });
    
    // Pagination ul elementini de ortalayalım
    $pagination.css({
        'display': 'inline-flex',
        'justify-content': 'center',
        'margin': '0 auto'
    });
    
    // Click event'lerini bağla
    $pagination.find('.page-link').on('click', function(e) {
        e.preventDefault();
        
        let $this = $(this);
        let $parent = $this.parent();
        
        // Disabled veya active olan butonlarda işlem yapma
        if ($parent.hasClass('disabled') || $parent.hasClass('active')) {
            return false;
        }
        
        let pageNum = parseInt($this.data('page'));
        if (!isNaN(pageNum) && pageNum >= 0) {
            table.page(pageNum).draw('page');
        }
    });
}

// File download function
function downloadFile(url) {
    try {
        const fullUrl = API_BASE_URL + url;
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = url.split('/').pop();
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Download error:', error);
        Swal.fire({
            icon: 'error',
            title: 'İndirme Hatası',
            text: 'Dosya indirilemedi'
        });
    }
}

// Preview image function
function previewImage(url) {
    try {
        const fullUrl = API_BASE_URL + url;
        Swal.fire({
            imageUrl: fullUrl,
            imageAlt: "Fotoğraf Önizleme",
            showCloseButton: true,
            showConfirmButton: false,
            width: 600,
            imageWidth: 500,
            imageHeight: 400,
            customClass: {
                image: 'img-fluid'
            }
        });
    } catch (error) {
        console.error('Preview error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Önizleme Hatası',
            text: 'Fotoğraf görüntülenemedi'
        });
    }
}

// Edit record function
function editRecord(id) {
    apiCall(`/applications/${id}`)
        .then(response => response.json())
        .then(data => {
            showEditModal(data);
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'Başvuru bilgileri alınamadı'
            });
        });
}

// Update status function
function updateStatus(id, currentStatus) {
    const statusOptions = {
        'pending': 'Beklemede',
        'processing': 'İşleniyor',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi',
        'cancelled': 'İptal Edildi'
    };

    const inputOptions = {};
    for (const [key, value] of Object.entries(statusOptions)) {
        inputOptions[key] = value;
    }

    Swal.fire({
        title: 'Durum Güncelle',
        text: `Başvuru durumunu seçin:`,
        input: 'radio',
        inputOptions: inputOptions,
        inputValue: currentStatus,
        showCancelButton: true,
        confirmButtonText: 'Güncelle',
        cancelButtonText: 'İptal',
        inputValidator: (value) => {
            if (!value) {
                return 'Bir durum seçmelisiniz!'
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            apiCall(`/applications/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: result.value })
            })
            .then(response => response.json())
            .then(data => {
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı',
                    text: 'Durum başarıyla güncellendi'
                });
                table.ajax.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: 'Durum güncellenemedi'
                });
            });
        }
    });
}

// Delete record function
function deleteRecord(id) {
    Swal.fire({
        title: 'Başvuruyu Sil',
        text: "Bu işlem geri alınamaz!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal'
    }).then((result) => {
        if (result.isConfirmed) {
            apiCall(`/applications/${id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Silindi',
                        text: 'Başvuru başarıyla silindi'
                    });
                    table.ajax.reload();
                } else {
                    throw new Error('Silme işlemi başarısız');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: 'Başvuru silinemedi'
                });
            });
        }
    });
}

// Show edit modal function
function showEditModal(application) {
    const formHtml = `
        <form id="editApplicationForm">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Ad</label>
                        <input type="text" class="form-control" name="ad" value="${application.ad || ''}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Soyad</label>
                        <input type="text" class="form-control" name="soyad" value="${application.soyad || ''}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">E-posta</label>
                        <input type="email" class="form-control" name="email" value="${application.email || ''}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Telefon</label>
                        <input type="text" class="form-control" name="telefon" value="${application.telefon || ''}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Vize Tipi</label>
                        <select class="form-control" name="vize_tipi" required>
                            <option value="Tourist" ${application.vize_tipi === 'Tourist' ? 'selected' : ''}>Tourist</option>
                            <option value="Business" ${application.vize_tipi === 'Business' ? 'selected' : ''}>Business</option>
                            <option value="Transit" ${application.vize_tipi === 'Transit' ? 'selected' : ''}>Transit</option>
                            <option value="Student" ${application.vize_tipi === 'Student' ? 'selected' : ''}>Student</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Vize Giriş</label>
                        <select class="form-control" name="vize_giris" required>
                            <option value="Single Entry" ${application.vize_giris === 'Single Entry' ? 'selected' : ''}>Single Entry</option>
                            <option value="Multiple Entry" ${application.vize_giris === 'Multiple Entry' ? 'selected' : ''}>Multiple Entry</option>
                        </select>
                    </div>
                </div>
            </div>
        </form>
    `;

    Swal.fire({
        title: 'Başvuru Düzenle',
        html: formHtml,
        showCancelButton: true,
        confirmButtonText: 'Güncelle',
        cancelButtonText: 'İptal',
        width: '800px',
        preConfirm: () => {
            const form = document.getElementById('editApplicationForm');
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            return data;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            Object.keys(result.value).forEach(key => {
                formData.append(key, result.value[key]);
            });

            fetch(API_BASE_URL + `/applications/${application.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Başarılı',
                        text: 'Başvuru başarıyla güncellendi'
                    });
                    table.ajax.reload();
                } else {
                    throw new Error('Güncelleme başarısız');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: 'Başvuru güncellenemedi'
                });
            });
        }
    });
}

// Sign out function
function signOut() {
    Swal.fire({
        title: 'Çıkış Yap',
        text: 'Oturumu kapatmak istediğinizden emin misiniz?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e30613',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Evet, Çıkış Yap',
        cancelButtonText: 'İptal'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            window.location.href = '/sign-in.html';
        }
    });
}

// View application function - Sayfa yönlendirmesi (POPUP AÇMAZ!)
function viewApplication(id) {
    console.log('Yönlendiriliyor... ID:', id);
    // Hiçbir API çağrısı yapmadan direkt sayfaya yönlendir
    window.location.href = `application-details.html?id=${id}`;
    return false; // Diğer olayları durdur
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

// Header search functionality - Kaldırıldı, header-functions.js'de var

// Initialize when DOM is ready
$(document).ready(function() {
    KTApplicationsList.init();
});