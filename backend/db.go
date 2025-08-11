package main

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func ConnectDB() {
	var err error

	// ✅ Direkt bağlantı bilgisiyle DSN oluştur
	dsn := "root:347834@tcp(127.0.0.1:3306)/vize"

	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		panic(err)
	}

	if err = DB.Ping(); err != nil {
		panic(err)
	}

	fmt.Println("MySQL bağlantısı başarılı!")
}
