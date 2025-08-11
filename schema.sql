create database vize;
use vize;

-- Kullanıcılar tablosu
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff'
);

-- Giriş logları
CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    ip VARCHAR(50),
    status VARCHAR(20),
    user_type VARCHAR(20),
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Başvurular
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ad VARCHAR(100),
    soyad VARCHAR(100),
    email VARCHAR(150),
    telefon VARCHAR(50),
    vize_tipi VARCHAR(50),
    vize_giris VARCHAR(50),
    express VARCHAR(10),
    sigorta VARCHAR(10),
    passport VARCHAR(255),
    biometric_photo VARCHAR(255),
    hotel_reservation VARCHAR(255),
    flight_ticket VARCHAR(255),
    status ENUM('pending','processing','approved','rejected','cancelled') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Başvuru yorumları
CREATE TABLE application_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- şifre admin123
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@example.com', '$2a$14$TLkUbGLQ7yWJyMVmZZv.8efORAI0kVinDxonu.c07jr7JxmBnkyh2', 'admin');

select*from users;
