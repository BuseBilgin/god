package main

import (
	"encoding/json" // Bunu ekledik
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("gizliAnahtar")

type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID int, role string) (string, error) {
	expiration := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiration),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateJWT(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("geçersiz token")
	}
	return claims, nil
}

func extractToken(r *http.Request) string {
	bearer := r.Header.Get("Authorization")
	if strings.HasPrefix(bearer, "Bearer ") {
		return strings.TrimPrefix(bearer, "Bearer ")
	}
	return ""
}

func getUserID(r *http.Request) int {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		return 0
	}
	return claims.UserID
}

func getUserRole(r *http.Request) string {
	claims, _ := ValidateJWT(extractToken(r))
	if claims != nil {
		return claims.Role
	}
	return ""
}

func isAdmin(r *http.Request) bool {
	return getUserRole(r) == "admin"
}

func isStaff(r *http.Request) bool {
	return getUserRole(r) == "staff"
}

func AuthenticateMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenHeader := r.Header.Get("Authorization")
		fmt.Println("Gelen Authorization Header:", tokenHeader)

		_, err := ValidateJWT(extractToken(r))
		if err != nil {
			fmt.Println("JWT doğrulama hatası:", err)
			http.Error(w, "Yetkisiz erişim", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// ✅ /me endpoint'ini işleyen fonksiyon
func GetMe(w http.ResponseWriter, r *http.Request) {
	claims, err := ValidateJWT(extractToken(r))
	if err != nil {
		http.Error(w, "Token geçersiz", http.StatusUnauthorized)
		return
	}

	response := map[string]interface{}{
		"user_id": claims.UserID,
		"role":    claims.Role,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
