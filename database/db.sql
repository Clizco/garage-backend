-- Creando la base de datos --
CREATE DATABASE pmdb;

-- Accediendo a la base de datos --
use PMDB;

CREATE TABLE accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_name VARCHAR(45) NOT NULL,
    account_legal_name VARCHAR(45) NOT NULL,
    account_nif VARCHAR(45) NOT NULL,
    account_website VARCHAR(45) NOT NULL,
    account_phone VARCHAR(45) NOT NULL,
    account_country VARCHAR(45) NOT NULL,
    account_province VARCHAR(45) NOT NULL,
    account_city VARCHAR(45) NOT NULL,
    account_address VARCHAR(255) NOT NULL,
    account_relationship ENUM('CLIENTE', 'PROVEEDOR') NOT NULL,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    contact_firstname VARCHAR(45) NOT NULL,
    contact_lastname VARCHAR(45) NOT NULL,
    contact_email VARCHAR(45) NOT NULL UNIQUE,
    contact_phonenumber VARCHAR(45) NOT NULL UNIQUE,
    contact_position VARCHAR(45) NOT NULL,
    contact_department VARCHAR(45) NOT NULL,
    contact_relationship INT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(45) NOT NULL
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_firstname VARCHAR(45) NOT NULL,
    user_lastname VARCHAR(45) NOT NULL,
    user_email VARCHAR(45) NOT NULL UNIQUE ,
    user_password VARCHAR(60) NOT NULL,
    user_phonenumber VARCHAR(45) NOT NULL UNIQUE,
    role_id INT,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ticket_title VARCHAR(100) NOT NULL,
    ticket_description VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    video_path VARCHAR(255) DEFAULT NULL;
    status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
    relatedto ENUM('MACHETAZO SAN MIGUELITO', 'MACHETAZO BRISAS DEL GOLF', 'MACHETAZO CHITRE', 'RODELAG') NOT NULL,
    user_id INT
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    product_name VARCHAR(45) NOT NULL,
    product_description VARCHAR(45) NOT NULL,
    product_price VARCHAR(45) NOT NULL,
    users_id INT,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id)
);


-- Accediendo a la tablas --
use users;
use roles;
use products;
use contact;
use accounts;

-- to show all tables --
show tables;

-- to describe table --
describe users; 