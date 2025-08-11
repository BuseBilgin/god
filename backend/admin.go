package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

// Kullanıcı veri yapısı
type User struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"` // Listelemede şifre gösterilmesin
	Role     string `json:"role"`               // admin, staff
}

// Yeni kullanıcı oluşturma (sadece admin)
func CreateUser(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Şifre hash hatası", http.StatusInternalServerError)
		return
	}

	_, err = DB.Exec("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
		user.Name, user.Email, string(hashedPassword), user.Role)
	if err != nil {
		http.Error(w, "Kullanıcı eklenemedi", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Yeni kullanıcı oluşturuldu"))
}

// Kullanıcıları listele (sadece admin)
func ListUsers(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	rows, err := DB.Query("SELECT id, name, email, role FROM users")
	if err != nil {
		http.Error(w, "Kullanıcılar alınamadı", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role)
		if err != nil {
			http.Error(w, "Satır okunamadı", http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// Kullanıcının rolünü güncelleme (sadece admin)
func UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	id := mux.Vars(r)["id"]

	// Frontend JSON { "role": "admin" } veya { "role": "staff" } gönderiyor
	var body struct {
		Role string `json:"role"`
	}

	// JSON verisini çözümle
	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	// ENUM geçerlilik kontrolü
	if body.Role != "admin" && body.Role != "staff" {
		http.Error(w, "Geçersiz rol", http.StatusBadRequest)
		return
	}

	// Veritabanında rolü güncelle
	_, err = DB.Exec("UPDATE users SET role=? WHERE id=?", body.Role, id)
	if err != nil {
		log.Println("Rol güncelleme hatası:", err)
		http.Error(w, "Rol güncellenemedi", http.StatusInternalServerError)
		return
	}

	// Başarılı yanıt
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Kullanıcının rolü güncellendi",
		"new_role": body.Role,
	})
}

// Kullanıcı silme (sadece admin)
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	id := mux.Vars(r)["id"]

	// Önce login_logs kayıtlarını sil
	_, err := DB.Exec("DELETE FROM login_logs WHERE user_id = ?", id)
	if err != nil {
		log.Println("Login logları silinirken hata:", err)
		http.Error(w, "Loglar silinemedi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Sonra kullanıcıyı sil
	_, err = DB.Exec("DELETE FROM users WHERE id = ?", id)
	if err != nil {
		log.Println("Kullanıcı silme hatası:", err)
		http.Error(w, "Kullanıcı silinemedi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write([]byte("Kullanıcı başarıyla silindi"))
}
