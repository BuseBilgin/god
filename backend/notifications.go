package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// NotificationSettings - bildirim ayarları yapısı
type NotificationSettings struct {
	UserID               int  `json:"user_id"`
	EmailNewApplication  bool `json:"email_new_application"`
	EmailStatusUpdate    bool `json:"email_status_update"`
	EmailSystemUpdate    bool `json:"email_system_update"`
	EmailWeeklyReport    bool `json:"email_weekly_report"`
	BrowserNotifications bool `json:"browser_notifications"`
	SoundNotifications   bool `json:"sound_notifications"`
}

// GetNotificationSettings - kullanıcının bildirim ayarlarını getir
func GetNotificationSettings(w http.ResponseWriter, r *http.Request) {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		http.Error(w, "Token geçersiz", http.StatusUnauthorized)
		return
	}

	var settings NotificationSettings
	err = DB.QueryRow(`SELECT 
		user_id, email_new_application, email_status_update, 
		email_system_update, email_weekly_report, 
		browser_notifications, sound_notifications
		FROM notification_settings WHERE user_id = ?`, claims.UserID).
		Scan(&settings.UserID, &settings.EmailNewApplication,
			&settings.EmailStatusUpdate, &settings.EmailSystemUpdate,
			&settings.EmailWeeklyReport, &settings.BrowserNotifications,
			&settings.SoundNotifications)

	if err != nil {
		// Ayar yoksa varsayılan değerler döndür
		settings = NotificationSettings{
			UserID:               claims.UserID,
			EmailNewApplication:  true,
			EmailStatusUpdate:    true,
			EmailSystemUpdate:    false,
			EmailWeeklyReport:    true,
			BrowserNotifications: false,
			SoundNotifications:   false,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

// UpdateNotificationSettings - bildirim ayarlarını güncelle
func UpdateNotificationSettings(w http.ResponseWriter, r *http.Request) {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		http.Error(w, "Token geçersiz", http.StatusUnauthorized)
		return
	}

	var settings NotificationSettings
	err = json.NewDecoder(r.Body).Decode(&settings)
	if err != nil {
		http.Error(w, "Geçersiz veri", http.StatusBadRequest)
		return
	}

	// UPSERT işlemi (varsa güncelle, yoksa ekle)
	_, err = DB.Exec(`INSERT INTO notification_settings 
		(user_id, email_new_application, email_status_update, 
		email_system_update, email_weekly_report, 
		browser_notifications, sound_notifications) 
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
		email_new_application = VALUES(email_new_application),
		email_status_update = VALUES(email_status_update),
		email_system_update = VALUES(email_system_update),
		email_weekly_report = VALUES(email_weekly_report),
		browser_notifications = VALUES(browser_notifications),
		sound_notifications = VALUES(sound_notifications)`,
		claims.UserID, settings.EmailNewApplication,
		settings.EmailStatusUpdate, settings.EmailSystemUpdate,
		settings.EmailWeeklyReport, settings.BrowserNotifications,
		settings.SoundNotifications)

	if err != nil {
		http.Error(w, "Ayarlar kaydedilemedi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Bildirim ayarları başarıyla kaydedildi",
	})
}

// SendEmailNotification - e-posta bildirimi gönder (basit örnek)
func SendEmailNotification(userEmail, subject, message string) {
	// Burada gerçek e-posta gönderme kodunu yazacaksınız
	// SMTP, SendGrid, SES gibi servisler kullanabilirsiniz

	// Şimdilik sadece log yazdırıyoruz
	log.Printf("📧 E-posta gönderildi: %s -> %s: %s", userEmail, subject, message)
}

// CheckAndSendNotifications - yeni başvuru geldiğinde bildirimleri kontrol et
func CheckAndSendNotifications(applicationID int, eventType string) {
	// Tüm kullanıcıların bildirim ayarlarını kontrol et
	rows, err := DB.Query(`SELECT u.email, u.name, ns.email_new_application, ns.email_status_update 
		FROM users u 
		LEFT JOIN notification_settings ns ON u.id = ns.user_id 
		WHERE u.role IN ('admin', 'staff')`)

	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var email, name string
		var emailNew, emailStatus bool

		rows.Scan(&email, &name, &emailNew, &emailStatus)

		// Varsayılan değerler
		if email == "" {
			continue
		}

		shouldSend := false
		subject := ""
		message := ""

		switch eventType {
		case "new_application":
			shouldSend = emailNew
			subject = "Yeni Başvuru Bildirimi"
			message = "Yeni bir vize başvurusu oluşturuldu. ID: " + string(rune(applicationID))
		case "status_update":
			shouldSend = emailStatus
			subject = "Başvuru Durum Güncellemesi"
			message = "Başvuru durumu güncellendi. ID: " + string(rune(applicationID))
		}

		if shouldSend {
			go SendEmailNotification(email, subject, message) // Async gönder
		}
	}
}

// Bildirimleri listele (JWT ile kimlik doğrulama yapılır)
func GetUserNotifications(w http.ResponseWriter, r *http.Request) {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		http.Error(w, "Token geçersiz", http.StatusUnauthorized)
		return
	}

	rows, err := DB.Query(`SELECT id, title, message, is_read, created_at 
		FROM user_notifications 
		WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`, claims.UserID)
	if err != nil {
		http.Error(w, "Bildirimler alınamadı", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var notifs []map[string]interface{}
	for rows.Next() {
		var id int
		var title, message string
		var isRead bool
		var createdAt string
		rows.Scan(&id, &title, &message, &isRead, &createdAt)
		notifs = append(notifs, map[string]interface{}{
			"id":         id,
			"title":      title,
			"message":    message,
			"is_read":    isRead,
			"created_at": createdAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifs)
}
