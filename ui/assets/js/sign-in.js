"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#kt_sign_in_form");
    const submitBtn = document.querySelector("#kt_sign_in_submit");
    
    // Backend URL
    const API_BASE_URL = "https://god-1-lsu5.onrender.com";

    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value.trim();

        if (!email || !password) {
            Swal.fire({ text: "Lütfen tüm alanları doldurun", icon: "warning" });
            return;
        }

        // Loading göstergesini başlat
        submitBtn.setAttribute("data-kt-indicator", "on");
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Token ve role bilgilerini kaydet
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("userEmail", data.email || email);
                localStorage.setItem("userName", data.name || data.user?.name || "Kullanıcı");

                // Başarılı giriş mesajı
                Swal.fire({
                    text: `Hoş geldiniz!`,
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    // Yönlendirme yap
                    if (data.role === "admin") {
                        window.location.href = "ui/admin/dashboard.html";
                    } else {
                        window.location.href = "list.html";
                    }
                });
                
                // Yönlendirme başladıktan sonra kodun devam etmemesi için return
                return;
            } else {
                // Sadece hata durumunda loading'i kaldır
                submitBtn.removeAttribute("data-kt-indicator");
                submitBtn.disabled = false;
                Swal.fire({ 
                    text: data.message || "Geçersiz kullanıcı bilgileri", 
                    icon: "error" 
                });
            }
        } catch (err) {
            // Hata durumunda loading'i kaldır
            submitBtn.removeAttribute("data-kt-indicator");
            submitBtn.disabled = false;
            
            console.error("Login error:", err);
            
            // Network error kontrolü
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                Swal.fire({ 
                    text: "Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.", 
                    icon: "error" 
                });
            } else {
                Swal.fire({ 
                    text: "Sunucu hatası. Lütfen tekrar deneyin.", 
                    icon: "error" 
                });
            }
        }
    });
});