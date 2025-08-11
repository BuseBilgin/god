package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/mux"
)

type Application struct {
	ID               int    `json:"id"`
	UserID           int    `json:"user_id"`
	Ad               string `json:"ad"`
	Soyad            string `json:"soyad"`
	Email            string `json:"email"`
	Telefon          string `json:"telefon"`
	VizeTipi         string `json:"vize_tipi"`
	VizeGiris        string `json:"vize_giris"`
	Express          string `json:"express"`
	Sigorta          string `json:"sigorta"`
	Passport         string `json:"passport"`
	BiometricPhoto   string `json:"biometric_photo"`
	HotelReservation string `json:"hotel_reservation"`
	FlightTicket     string `json:"flight_ticket"`
	Status           string `json:"status"`
}

// ✅ Tekli dosya kaydetme
func saveUploadedFile(r *http.Request, fieldName string) (string, error) {
	file, header, err := r.FormFile(fieldName)
	if err != nil {
		if err == http.ErrMissingFile {
			return "", nil
		}
		return "", err
	}
	defer file.Close()

	os.MkdirAll("uploads", os.ModePerm)
	filename := fmt.Sprintf("%d_%s", getUserID(r), filepath.Base(header.Filename))
	dstPath := filepath.Join("uploads", filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	io.Copy(dst, file)
	return "/uploads/" + filename, nil
}

// ✅ Çoklu yükleme için indexli dosya kaydetme
func saveUploadedFileWithIndex(r *http.Request, field string, idx int) (string, error) {
	key := fmt.Sprintf("%s[%d]", field, idx)
	file, header, err := r.FormFile(key)
	if err != nil {
		if err == http.ErrMissingFile {
			return "", nil
		}
		return "", err
	}
	defer file.Close()

	os.MkdirAll("uploads", os.ModePerm)
	filename := fmt.Sprintf("%d_%d_%s", getUserID(r), idx, filepath.Base(header.Filename))
	dstPath := filepath.Join("uploads", filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	io.Copy(dst, file)
	return "/uploads/" + filename, nil
}

// ✅ Çoklu başvuru (DOSYA destekli) - /api/applications
func CreateMultipleApplications(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		http.Error(w, "Form çözümlenemedi: "+err.Error(), http.StatusBadRequest)
		return
	}

	userID := getUserID(r)
	count := len(r.MultipartForm.Value["ad"])
	if count == 0 {
		http.Error(w, "Başvuru verisi yok", http.StatusBadRequest)
		return
	}

	for i := 0; i < count; i++ {
		ad := r.MultipartForm.Value["ad"][i]
		soyad := r.MultipartForm.Value["soyad"][i]
		email := r.MultipartForm.Value["email"][i]
		telefon := r.MultipartForm.Value["telefon"][i]
		vize := r.MultipartForm.Value["vize_tipi"][i]
		giris := r.MultipartForm.Value["vize_giris"][i]
		express := r.MultipartForm.Value["express"][i]
		sigorta := r.MultipartForm.Value["sigorta"][i]

		passport, _ := saveUploadedFileWithIndex(r, "passport", i)
		biometric, _ := saveUploadedFileWithIndex(r, "biometric_photo", i)
		hotel, _ := saveUploadedFileWithIndex(r, "hotel_reservation", i)
		flight, _ := saveUploadedFileWithIndex(r, "flight_ticket", i)

		_, err := DB.Exec(`
            INSERT INTO applications
            (user_id, ad, soyad, email, telefon, vize_tipi, vize_giris, express, sigorta,
             passport, biometric_photo, hotel_reservation, flight_ticket, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
			userID, ad, soyad, email, telefon, vize, giris, express, sigorta,
			passport, biometric, hotel, flight)
		if err != nil {
			http.Error(w, "Başvuru eklenemedi: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("✅ Tüm başvurular dosyalarla birlikte başarıyla kaydedildi"))
}

func CreateApplication(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) {
		http.Error(w, "Yalnızca staff başvuru yapabilir", http.StatusForbidden)
		return
	}

	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Form çözümlenemedi: "+err.Error(), http.StatusBadRequest)
		return
	}

	userID := getUserID(r)
	app := Application{
		UserID:    userID,
		Ad:        r.FormValue("ad"),
		Soyad:     r.FormValue("soyad"),
		Email:     r.FormValue("email"),
		Telefon:   r.FormValue("telefon"),
		VizeTipi:  r.FormValue("vize_tipi"),
		VizeGiris: r.FormValue("vize_giris"),
		Express:   r.FormValue("express"),
		Sigorta:   r.FormValue("sigorta"),
	}

	app.Passport, _ = saveUploadedFile(r, "passport")
	app.BiometricPhoto, _ = saveUploadedFile(r, "biometric_photo")
	app.HotelReservation, _ = saveUploadedFile(r, "hotel_reservation")
	app.FlightTicket, _ = saveUploadedFile(r, "flight_ticket")

	// ✅ DÜZELTME: result değişkenini al ve insertedID'yi çıkar
	result, err := DB.Exec(`INSERT INTO applications 
        (user_id, ad, soyad, email, telefon, vize_tipi, vize_giris, express, sigorta, passport, biometric_photo, hotel_reservation, flight_ticket, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
		app.UserID, app.Ad, app.Soyad, app.Email, app.Telefon, app.VizeTipi, app.VizeGiris, app.Express, app.Sigorta,
		app.Passport, app.BiometricPhoto, app.HotelReservation, app.FlightTicket)

	if err != nil {
		http.Error(w, "Başvuru eklenemedi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// ✅ DÜZELTME: insertedID'yi al
	insertedID, _ := result.LastInsertId()

	// ✅ Bildirim gönder
	CheckAndSendNotifications(int(insertedID), "new_application")

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Başvuru başarıyla oluşturuldu"))
}
func UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	idStr := mux.Vars(r)["id"] // ✅ DÜZELTME: string olarak al
	var body struct {
		Status string `json:"status"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	allowed := map[string]bool{"pending": true, "processing": true, "approved": true, "rejected": true, "cancelled": true}
	if !allowed[body.Status] {
		http.Error(w, "Geçersiz durum", http.StatusBadRequest)
		return
	}

	_, err := DB.Exec("UPDATE applications SET status=? WHERE id=?", body.Status, idStr)
	if err != nil {
		http.Error(w, "Durum güncellenemedi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// ✅ DÜZELTME: string'i int'e çevir
	id, _ := strconv.Atoi(idStr)
	CheckAndSendNotifications(id, "status_update")

	json.NewEncoder(w).Encode(map[string]string{"message": "Durum güncellendi", "status": body.Status})
}

// ✅ Yorum ve Dosya Yükleme
func AddApplicationComment(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	id := mux.Vars(r)["id"]
	userID := getUserID(r)
	r.ParseMultipartForm(10 << 20)

	comment := r.FormValue("comment")
	filePath, _ := saveUploadedFile(r, "file")

	_, err := DB.Exec(`INSERT INTO application_comments (application_id, user_id, comment, file_path) VALUES (?, ?, ?, ?)`,
		id, userID, comment, filePath)
	if err != nil {
		http.Error(w, "Yorum eklenemedi: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Yorum eklendi"})
}

// ✅ Yorumları Listele
func GetApplicationComments(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	id := mux.Vars(r)["id"]
	rows, err := DB.Query(`SELECT c.id, u.name, c.comment, c.file_path, c.created_at 
                            FROM application_comments c 
                            JOIN users u ON c.user_id=u.id 
                            WHERE application_id=? ORDER BY created_at DESC`, id)
	if err != nil {
		http.Error(w, "Yorumlar alınamadı", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []map[string]interface{}
	for rows.Next() {
		var cid int
		var uname, comment, file, created string
		rows.Scan(&cid, &uname, &comment, &file, &created)
		comments = append(comments, map[string]interface{}{
			"id": cid, "user": uname, "comment": comment, "file": file, "created_at": created,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// ✅ Başvuruları Listele
func GetApplications(w http.ResponseWriter, r *http.Request) {
	role := getUserRole(r)
	fmt.Println("📌 Kullanıcı rolü:", role)
	userID := getUserID(r)
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}

	var rows *sql.Rows
	var err error
	if isAdmin(r) {
		rows, err = DB.Query(`SELECT id,user_id,ad,soyad,email,telefon,vize_tipi,vize_giris,express,sigorta,
            passport,biometric_photo,hotel_reservation,flight_ticket,status FROM applications`)
	} else {
		rows, err = DB.Query(`SELECT id,user_id,ad,soyad,email,telefon,vize_tipi,vize_giris,express,sigorta,
            passport,biometric_photo,hotel_reservation,flight_ticket,status FROM applications WHERE user_id=?`, userID)
	}
	if err != nil {
		http.Error(w, "Veriler alınamadı", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	apps := []Application{}
	for rows.Next() {
		var app Application
		rows.Scan(&app.ID, &app.UserID, &app.Ad, &app.Soyad, &app.Email, &app.Telefon,
			&app.VizeTipi, &app.VizeGiris, &app.Express, &app.Sigorta,
			&app.Passport, &app.BiometricPhoto, &app.HotelReservation, &app.FlightTicket, &app.Status)
		apps = append(apps, app)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apps)
}

// ✅ ID ile Başvuru Getir
func GetApplicationByID(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}
	id := mux.Vars(r)["id"]
	row := DB.QueryRow(`SELECT id,user_id,ad,soyad,email,telefon,vize_tipi,vize_giris,express,sigorta,
        passport,biometric_photo,hotel_reservation,flight_ticket,status FROM applications WHERE id=?`, id)

	var app Application
	err := row.Scan(&app.ID, &app.UserID, &app.Ad, &app.Soyad, &app.Email, &app.Telefon,
		&app.VizeTipi, &app.VizeGiris, &app.Express, &app.Sigorta,
		&app.Passport, &app.BiometricPhoto, &app.HotelReservation, &app.FlightTicket, &app.Status)
	if err != nil {
		http.Error(w, "Başvuru bulunamadı", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(app)
}

// ✅ Başvuru Güncelleme
func UpdateApplication(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}
	id := mux.Vars(r)["id"]
	r.ParseMultipartForm(10 << 20)

	app := Application{
		Ad:        r.FormValue("ad"),
		Soyad:     r.FormValue("soyad"),
		Email:     r.FormValue("email"),
		Telefon:   r.FormValue("telefon"),
		VizeTipi:  r.FormValue("vize_tipi"),
		VizeGiris: r.FormValue("vize_giris"),
		Express:   r.FormValue("express"),
		Sigorta:   r.FormValue("sigorta"),
	}

	passport, _ := saveUploadedFile(r, "passport")
	if passport != "" {
		app.Passport = passport
	}
	biometric, _ := saveUploadedFile(r, "biometric_photo")
	if biometric != "" {
		app.BiometricPhoto = biometric
	}
	hotel, _ := saveUploadedFile(r, "hotel_reservation")
	if hotel != "" {
		app.HotelReservation = hotel
	}
	flight, _ := saveUploadedFile(r, "flight_ticket")
	if flight != "" {
		app.FlightTicket = flight
	}

	_, err := DB.Exec(`UPDATE applications SET ad=?,soyad=?,email=?,telefon=?,vize_tipi=?,vize_giris=?,express=?,sigorta=?,
        passport=IFNULL(NULLIF(?,''),passport),
        biometric_photo=IFNULL(NULLIF(?,''),biometric_photo),
        hotel_reservation=IFNULL(NULLIF(?,''),hotel_reservation),
        flight_ticket=IFNULL(NULLIF(?,''),flight_ticket)
        WHERE id=?`,
		app.Ad, app.Soyad, app.Email, app.Telefon, app.VizeTipi, app.VizeGiris, app.Express, app.Sigorta,
		app.Passport, app.BiometricPhoto, app.HotelReservation, app.FlightTicket, id)

	if err != nil {
		http.Error(w, "Güncelleme başarısız", http.StatusInternalServerError)
		return
	}
	w.Write([]byte("Başvuru güncellendi"))
}

// ✅ Başvuru Sil
func DeleteApplication(w http.ResponseWriter, r *http.Request) {
	if !isStaff(r) && !isAdmin(r) {
		http.Error(w, "Yetkisiz erişim", http.StatusForbidden)
		return
	}
	id := mux.Vars(r)["id"]
	_, err := DB.Exec("DELETE FROM applications WHERE id=?", id)
	if err != nil {
		http.Error(w, "Silme başarısız", http.StatusInternalServerError)
		return
	}
	w.Write([]byte("Başvuru silindi"))
}
