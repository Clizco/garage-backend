-- Creando la base de datos --
CREATE DATABASE petro;

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
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(45) NOT NULL,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    ticket_title ENUM(
        'Techos', 'Fachada (Estructural)', 'Estacionamientos (Estructural)', 
        'Losas internas', 'Goteras', 'Cimientos', 'Vidrieras', 'Limpieza Fachada', 
        'Cielo Raso', 'Puertas Mecanicas', 'Puertas Electricas', 'Aceras(Estructural)', 
        'Calles (Estructural)', 'Zonas Verdes', 'Aseo Areas Externas', 'Aire Acondicionado', 
        'Escaleras Electricas', 'Elevadores', 'Sistemas Contra Incendios', 'Alarma Local', 
        'Evaporadores', 'Compresores', 'Condensadores', 'Planta electrica', 'Transformadores', 
        'Material Electrico', 'Linea de Gas', 'Plomeria Enterrada en Cimientos', 
        'Plomeria No Enterrada en Cimientos', 'Alcantarillado', 'Tanques de Agua', 
        'Plantas de Tratamiento', 'Trampas de Grasa', 'Trampas de Agua'
    ) NOT NULL,
    ticket_priority ENUM('Urgente', 'Importante', 'Normal') NOT NULL DEFAULT 'Normal',
    ticket_description VARCHAR(255) NOT NULL,
    ticket_assignedto INT,
    file_path VARCHAR(255) DEFAULT NULL,
    video_path VARCHAR(255) DEFAULT NULL,
    ticket_status ENUM('Open', 'in_progress', 'closed') NOT NULL DEFAULT 'Open',
    ticket_relatedto INT,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    report_title VARCHAR(45) NOT NULL,
    report_description VARCHAR(500) NOT NULL,
    report_relatedto INT,
    user_id INT,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    property_name VARCHAR(45) NOT NULL,
    property_country VARCHAR(45) NOT NULL,
    property_province VARCHAR(45) NOT NULL,
    property_city VARCHAR(45) NOT NULL,
    property_address VARCHAR(255) NOT NULL,
    property_relationship INT,
    document_path VARCHAR(255) DEFAULT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    users_id INT,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id)
);

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invoice_number VARCHAR(45) NOT NULL,
    invoice_date VARCHAR(45) NOT NULL,
    invoice_due_date VARCHAR(45) NOT NULL,
    invoice_total VARCHAR(45) NOT NULL,
    invoice_description VARCHAR(255) NOT NULL,
    invoice_status ENUM('PENDIENTE', 'PAGADA') NOT NULL,
    invoice_relationship INT,
    file_path VARCHAR(255) DEFAULT NULL,
    users_id INT,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id)
);

CREATE TABLE legal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    legal_name VARCHAR(45) NOT NULL,
    legal_nif VARCHAR(45) NOT NULL,
    legal_country VARCHAR(45) NOT NULL,
    legal_province VARCHAR(45) NOT NULL,
    legal_city VARCHAR(45) NOT NULL,
    legal_address VARCHAR(255) NOT NULL,
    document_path VARCHAR(255) DEFAULT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    users_id INT,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (users_id) REFERENCES users(id)
);

CREATE TABLE providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    provider_name VARCHAR(45) NOT NULL,
    provider_legal_name VARCHAR(45) NOT NULL,
    provider_nif VARCHAR(45) NOT NULL,
    provider_website VARCHAR(45) NOT NULL,
    provider_phone VARCHAR(45) NOT NULL,
    provider_country VARCHAR(45) NOT NULL,
    provider_province VARCHAR(45) NOT NULL,
    provider_city VARCHAR(45) NOT NULL,
    provider_address VARCHAR(255) NOT NULL,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_name VARCHAR(45) NOT NULL,
    client_legal_name VARCHAR(45) NOT NULL,
    client_nif VARCHAR(45) NOT NULL,
    client_website VARCHAR(45) NOT NULL,
    client_phone VARCHAR(45) NOT NULL,
    client_country VARCHAR(45) NOT NULL,
    client_province VARCHAR(45) NOT NULL,
    client_city VARCHAR(45) NOT NULL,
    client_address VARCHAR(255) NOT NULL,
    updated_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
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