"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#kt_free_trial_form");
    const submitBtn = document.querySelector("#kt_free_trial_submit");

    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value.trim();

        if (!name || !email || !password) {
            Swal.fire({ text: "Lütfen tüm alanları doldurun.", icon: "warning" });
            return;
        }

        submitBtn.setAttribute("data-kt-indicator", "on");
        submitBtn.disabled = true;

        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            submitBtn.removeAttribute("data-kt-indicator");
            submitBtn.disabled = false;

            if (res.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);

                Swal.fire({
                    text: "Kayıt başarılı! Şimdi giriş sayfasına yönlendiriliyorsunuz.",
                    icon: "success",
                    confirmButtonText: "Tamam"
                }).then(() => location.href = "sign-in.html");
            } else {
                Swal.fire({ text: data.message || "Kayıt başarısız.", icon: "error" });
            }
        } catch (err) {
            submitBtn.removeAttribute("data-kt-indicator");
            submitBtn.disabled = false;
            Swal.fire({ text: "Sunucu hatası. Daha sonra tekrar deneyin.", icon: "error" });
        }
    });
});
