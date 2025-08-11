package main

import (
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

// ProfileRequest - profil güncelleme için veri yapısı
type ProfileRequest struct {
	Name       string `json:"name"`
	Phone      string `json:"phone"`
	Department string `json:"department"`
}

// UserProfile - detaylı kullanıcı profili
type UserProfile struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	Phone      string `json:"phone"`
	Department string `json:"department"`
}

// PasswordChangeRequest - şifre değiştirme için veri yapısı
type PasswordChangeRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// GetProfile - kullanıcının detaylı profil bilgilerini getir
func GetProfile(w http.ResponseWriter, r *http.Request) {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		http.Error(w, "Token geçersiz", http.StatusUnauthorized)
		return
	}

	var profile UserProfile
	err = DB.QueryRow(`SELECT id, name, email, role, 
		COALESCE(phone, '') as phone, 
		COALESCE(department, '') as department 
		FROM users WHERE id = ?`, claims.UserID).
		Scan(&profile.ID, &profile.Name, &profile.Email, &profile.Role, &profile.Phone, &profile.Department)

	if err != nil {
		http.Error(w, "Kullanıcı bilgileri alınamadı", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

// UpdateProfile - kullanıcı profil bilgilerini güncelle
func UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		http.Error(w, "Token geçersiz", http.StatusUnauthorized)
		return
	}

	var profileReq ProfileRequest
	err = json.NewDecoder(r.Body).Decode(&profileReq)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	// Profil bilgilerini güncelle
	_, err = DB.Exec(`UPDATE users SET 
		name = COALESCE(NULLIF(?, ''), name),
		phone = COALESCE(NULLIF(?, ''), phone),
		department = COALESCE(NULLIF(?, ''), department)
		WHERE id = ?`,
		profileReq.Name, profileReq.Phone, profileReq.Department, claims.UserID)

	if err != nil {
		http.Error(w, "Profil güncellenemedi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Profil başarıyla güncellendi",
	})
}

// ChangePassword - kullanıcı şifresini değiştir
func ChangePassword(w http.ResponseWriter, r *http.Request) {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		http.Error(w, "Token geçersiz", http.StatusUnauthorized)
		return
	}

	var passwordReq PasswordChangeRequest
	err = json.NewDecoder(r.Body).Decode(&passwordReq)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	// Mevcut şifreyi doğrula
	var currentHashedPassword string
	err = DB.QueryRow("SELECT password FROM users WHERE id = ?", claims.UserID).
		Scan(&currentHashedPassword)
	if err != nil {
		http.Error(w, "Kullanıcı bulunamadı", http.StatusNotFound)
		return
	}

	// Mevcut şifre kontrolü
	err = bcrypt.CompareHashAndPassword([]byte(currentHashedPassword), []byte(passwordReq.CurrentPassword))
	if err != nil {
		http.Error(w, "Mevcut şifre hatalı", http.StatusBadRequest)
		return
	}

	// Yeni şifre uzunluk kontrolü
	if len(passwordReq.NewPassword) < 6 {
		http.Error(w, "Yeni şifre en az 6 karakter olmalıdır", http.StatusBadRequest)
		return
	}

	// Yeni şifreyi hashle
	hashedNewPassword, err := bcrypt.GenerateFromPassword([]byte(passwordReq.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Şifre işlenemedi", http.StatusInternalServerError)
		return
	}

	// Şifreyi güncelle
	_, err = DB.Exec("UPDATE users SET password = ? WHERE id = ?", string(hashedNewPassword), claims.UserID)
	if err != nil {
		http.Error(w, "Şifre güncellenemedi", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Şifre başarıyla değiştirildi",
	})
}

// GetSystemStats - sistem istatistikleri (admin ve staff için)
func GetSystemStats(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	stats := make(map[string]interface{})

	// Toplam başvuru sayısı
	var totalApplications int
	DB.QueryRow("SELECT COUNT(*) FROM applications").Scan(&totalApplications)
	stats["totalApplications"] = totalApplications

	// Durum bazlı başvuru sayıları
	var pendingApps, processingApps, approvedApps, rejectedApps, cancelledApps int
	DB.QueryRow("SELECT COUNT(*) FROM applications WHERE status = 'pending'").Scan(&pendingApps)
	DB.QueryRow("SELECT COUNT(*) FROM applications WHERE status = 'processing'").Scan(&processingApps)
	DB.QueryRow("SELECT COUNT(*) FROM applications WHERE status = 'approved'").Scan(&approvedApps)
	DB.QueryRow("SELECT COUNT(*) FROM applications WHERE status = 'rejected'").Scan(&rejectedApps)
	DB.QueryRow("SELECT COUNT(*) FROM applications WHERE status = 'cancelled'").Scan(&cancelledApps)

	stats["pendingApplications"] = pendingApps
	stats["processingApplications"] = processingApps
	stats["approvedApplications"] = approvedApps
	stats["rejectedApplications"] = rejectedApps
	stats["cancelledApplications"] = cancelledApps

	// Aktif kullanıcı sayısı (sadece admin görebilir)
	if isAdmin(r) {
		var activeUsers int
		DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&activeUsers)
		stats["activeUsers"] = activeUsers
	}

	// Son 30 günün başarılı giriş sayısı
	var successfulLogins int
	DB.QueryRow(`SELECT COUNT(*) FROM login_logs 
		WHERE status = 'success' AND log_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)`).Scan(&successfulLogins)
	stats["successfulLogins"] = successfulLogins

	stats["uptime"] = "99.8%"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
