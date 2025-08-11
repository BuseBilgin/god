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

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func ConnectDB() {
	var err error
	var dsn string

	// Option 1: Use DATABASE_URL or MYSQL_PUBLIC_URL if available
	if databaseURL := os.Getenv("DATABASE_URL"); databaseURL != "" {
		dsn = databaseURL
		fmt.Println("Using DATABASE_URL connection")
	} else if mysqlURL := os.Getenv("MYSQL_PUBLIC_URL"); mysqlURL != "" {
		dsn = mysqlURL
		fmt.Println("Using MYSQL_PUBLIC_URL connection")
	} else {
		// Option 2: Use individual environment variables
		host := getenv("MYSQLHOST", "maglev.proxy.rlwy.net")
		port := getenv("MYSQLPORT", "3306")
		user := getenv("MYSQLUSER", "root")
		pass := os.Getenv("MYSQLPASSWORD")
		name := getenv("MYSQLDATABASE", "vize")

		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&tls=skip-verify",
			user, pass, host, port, name)
		fmt.Println("Using individual MySQL environment variables")
	}

	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}

	DB.SetMaxOpenConns(10)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(time.Hour)

	if err = DB.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}

	// Use vize database after connection
	if _, err = DB.Exec("USE vize"); err != nil {
		log.Printf("Could not use vize database: %v", err)
		// Continue with default database
	} else {
		fmt.Println("Successfully switched to vize database")
	}

	fmt.Println("Railway MySQL bağlantısı başarılı!")
}
