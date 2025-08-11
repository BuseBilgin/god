package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func ConnectDB() {
	var err error

	host := os.Getenv("MYSQLHOST")
	port := os.Getenv("MYSQLPORT")
	user := os.Getenv("MYSQLUSER")
	pass := os.Getenv("MYSQLPASSWORD")
	name := os.Getenv("MYSQLDATABASE")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&tls=true",
		user, pass, host, port, name)

	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}

	DB.SetMaxOpenConns(10)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(time.Hour)

	if err = DB.Ping(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("MySQL bağlantısı başarılı!")
}
