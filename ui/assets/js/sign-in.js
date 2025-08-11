"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#kt_sign_in_form");
    const submitBtn = document.querySelector("#kt_sign_in_submit");

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
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Token ve role bilgilerini kaydet
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);

                // Hiçbir mesaj göstermeden direkt yönlendirme yap
                window.location.href = (data.role === "admin") 
                    ? "ui/admin/dashboard.html" 
                    : "/list.html";
                    
                // Yönlendirme başladıktan sonra kodun devam etmemesi için return
                return;
            } else {
                // Sadece hata durumunda loading'i kaldır
                submitBtn.removeAttribute("data-kt-indicator");
                submitBtn.disabled = false;
                Swal.fire({ text: data.message || "Geçersiz kullanıcı bilgileri", icon: "error" });
            }
        } catch (err) {
            // Hata durumunda loading'i kaldır
            submitBtn.removeAttribute("data-kt-indicator");
            submitBtn.disabled = false;
            Swal.fire({ text: "Sunucu hatası. Lütfen tekrar deneyin.", icon: "error" });
        }
    });
});