"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#kt_free_trial_form");
    const submitBtn = document.querySelector("#kt_free_trial_submit");
    
    // Backend URL
    const API_BASE_URL = "https://god-1-lsu5.onrender.com";

    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value.trim();

        if (!name || !email || !password) {
            Swal.fire({ text: "Lütfen tüm alanları doldurun.", icon: "warning" });
            return;
        }

        // Basit email validasyonu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({ text: "Geçerli bir email adresi girin.", icon: "warning" });
            return;
        }

        // Şifre kontrolü
        if (password.length < 6) {
            Swal.fire({ text: "Şifre en az 6 karakter olmalıdır.", icon: "warning" });
            return;
        }

        submitBtn.setAttribute("data-kt-indicator", "on");
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            
            submitBtn.removeAttribute("data-kt-indicator");
            submitBtn.disabled = false;

            if (res.ok) {
                // Token ve kullanıcı bilgilerini kaydet
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role || "user");
                localStorage.setItem("userEmail", data.email || email);
                localStorage.setItem("userName", data.name || name);

                Swal.fire({
                    text: "Kayıt başarılı! Şimdi giriş sayfasına yönlendiriliyorsunuz.",
                    icon: "success",
                    confirmButtonText: "Tamam"
                }).then(() => {
                    window.location.href = "sign-in.html";
                });
            } else {
                Swal.fire({ 
                    text: data.message || "Kayıt başarısız.", 
                    icon: "error" 
                });
            }
        } catch (err) {
            submitBtn.removeAttribute("data-kt-indicator");
            submitBtn.disabled = false;
            
            console.error("Register error:", err);
            
            // Network error kontrolü
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                Swal.fire({ 
                    text: "Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.", 
                    icon: "error" 
                });
            } else {
                Swal.fire({ 
                    text: "Sunucu hatası. Daha sonra tekrar deneyin.", 
                    icon: "error" 
                });
            }
        }
    });
});