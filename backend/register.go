package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// RegisterUser - yeni kullanıcı kaydı için veri yapısı
type RegisterUser struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RegisterHandler - staff rolü ile kullanıcı kaydeder

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Yalnızca POST isteği gönderin", http.StatusMethodNotAllowed)
		return
	}

	var user RegisterUser
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	// Şifre hashleme
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Şifre işlenemedi", http.StatusInternalServerError)
		return
	}

	// Veritabanına ekle
	res, err := DB.Exec("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
		user.Name, user.Email, string(hashedPassword), "staff")
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			http.Error(w, "Bu e-posta adresi zaten kayıtlı", http.StatusConflict)
			return
		}
		http.Error(w, "Veritabanı hatası: "+err.Error(), http.StatusInternalServerError)
		return
	}

	//  Yeni kullanıcının ID'sini al
	userID, _ := res.LastInsertId()

	// Staff rolü ile token üret
	token, err := GenerateJWT(int(userID), "staff")
	if err != nil {
		http.Error(w, "Token oluşturulamadı", http.StatusInternalServerError)
		return
	}

	// Token'i frontend'e JSON olarak döndür
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Kayıt başarılı",
		"token":   token,
		"role":    "staff",
	})
}
