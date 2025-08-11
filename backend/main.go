package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
)

func main() {
	// ✅ Veritabanına bağlan
	ConnectDB()

	// ✅ Router oluştur
	r := mux.NewRouter()
	r.Use(corsMiddleware)

	// ✅ Health check (Render Settings > Health Check Path: /healthz)
	r.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}).Methods("GET")

	// ✅ uploads klasörünü public sun
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	// 🔹 Kimlik doğrulama işlemleri
	r.HandleFunc("/register", RegisterHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/login", LoginHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/me", AuthenticateMiddleware(GetMe)).Methods("GET", "OPTIONS")
	r.HandleFunc("/logs", AuthenticateMiddleware(GetLoginLogs)).Methods("GET", "OPTIONS")

	// 🔹 Başvuru işlemleri (CRUD + Yeni Özellikler)
	r.HandleFunc("/applications", AuthenticateMiddleware(CreateApplication)).Methods("POST", "OPTIONS")
	r.HandleFunc("/applications", AuthenticateMiddleware(GetApplications)).Methods("GET", "OPTIONS")
	r.HandleFunc("/applications/{id}", AuthenticateMiddleware(UpdateApplication)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/applications/{id}", AuthenticateMiddleware(DeleteApplication)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/applications/{id}", AuthenticateMiddleware(GetApplicationByID)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/applications", AuthenticateMiddleware(CreateMultipleApplications)).Methods("POST", "OPTIONS")

	// ✅ Yeni: Çoklu Başvuru JSON Array ile
	r.HandleFunc("/applications/multi", AuthenticateMiddleware(CreateApplication)).Methods("POST", "OPTIONS")

	// ✅ Yeni: Kişi Bazlı Durum Güncelleme
	r.HandleFunc("/applications/{id}/status", AuthenticateMiddleware(UpdateApplicationStatus)).Methods("PUT", "OPTIONS")

	// ✅ Yeni: Yorum Ekleme & Listeleme
	r.HandleFunc("/applications/{id}/comments", AuthenticateMiddleware(AddApplicationComment)).Methods("POST", "OPTIONS")
	r.HandleFunc("/applications/{id}/comments", AuthenticateMiddleware(GetApplicationComments)).Methods("GET", "OPTIONS")

	// 🔹 Profil yönetimi endpoint'leri
	r.HandleFunc("/profile", AuthenticateMiddleware(GetProfile)).Methods("GET", "OPTIONS")
	r.HandleFunc("/profile", AuthenticateMiddleware(UpdateProfile)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/change-password", AuthenticateMiddleware(ChangePassword)).Methods("POST", "OPTIONS")
	r.HandleFunc("/system-stats", AuthenticateMiddleware(GetSystemStats)).Methods("GET", "OPTIONS")

	// 🔹 Bildirim ayarları
	r.HandleFunc("/notification-settings", AuthenticateMiddleware(GetNotificationSettings)).Methods("GET", "OPTIONS")
	r.HandleFunc("/notification-settings", AuthenticateMiddleware(UpdateNotificationSettings)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/notifications", AuthenticateMiddleware(GetUserNotifications)).Methods("GET", "OPTIONS")

	// 🔹 Admin kullanıcı işlemleri
	r.HandleFunc("/users", AuthenticateMiddleware(CreateUser)).Methods("POST", "OPTIONS")
	r.HandleFunc("/users", AuthenticateMiddleware(ListUsers)).Methods("GET", "OPTIONS")
	r.HandleFunc("/users/{id}/role", AuthenticateMiddleware(UpdateUserRole)).Methods("PUT", "OPTIONS")
	r.HandleFunc("/users/{id}", AuthenticateMiddleware(DeleteUser)).Methods("DELETE", "OPTIONS")

	// 🔹 SPA/Metronic dosyaları (en sonda kalsın)r.PathPrefix("/").Handler(http.FileServer(http.Dir("./ui")))

	// ✅ Render PORT environment variable'ını kullan
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Local development için default
	}

	log.Printf("🚀 Sunucu %s portunda çalışıyor...", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// ✅ Gelişmiş CORS middleware – credentials ile güvenli whitelist
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		allowed := false
		if origin != "" {
			if strings.HasPrefix(origin, "http://localhost") ||
				strings.HasPrefix(origin, "http://127.0.0.1") ||
				strings.Contains(origin, ".netlify.app") ||
				strings.Contains(origin, ".onrender.com") {
				allowed = true
			}
		}

		if allowed {
			// Credentials kullanılacaksa * OLMAZ; istekteki origin'i yansıt
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		} else if origin == "" {
			// Same-origin isteklerde sorun yaşamamak için herhangi bir header set etme
		} else {
			// İzinli değilse generic ama credentials'sız cevap ver (tarayıcı reddeder)
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Accept-Language, Content-Language, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
