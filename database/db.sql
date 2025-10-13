-- Creando la base de datos --
CREATE DATABASE koli;

-- Accediendo a la base de datos --
use koli;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(45) NOT NULL,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_firstname VARCHAR(45) NOT NULL,
    user_lastname VARCHAR(45) NOT NULL,
    user_email VARCHAR(45) NOT NULL UNIQUE,
    user_password VARCHAR(60) NOT NULL,
    user_phonenumber VARCHAR(45) NOT NULL UNIQUE,
    user_unique_id VARCHAR(45) NOT NULL UNIQUE,
    role_id INT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE provinces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province_name VARCHAR(45) NOT NULL,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE driver (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(45) NOT NULL,
    driver_phonenumber VARCHAR(45) NOT NULL UNIQUE,
    driver_email VARCHAR(45) NOT NULL UNIQUE,
    driver_password VARCHAR(60) NOT NULL,
    driver_province INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_province) REFERENCES provinces(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    ruv VARCHAR(50),
    ubicacion VARCHAR(100),
    propietario VARCHAR(100),
    municipio VARCHAR(100) NOT NULL,        
    mes_de_placa VARCHAR(20) NOT NULL,      
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    capacidad INT NOT NULL,
    ton DECIMAL(10,2) NOT NULL,
    `year` YEAR NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    uso VARCHAR(100) NOT NULL,
    precio VARCHAR(45) NOT NULL,         
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE vehicle_inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  tipo ENUM('entrada', 'salida') NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  kilometraje INT,
  nivel_combustible VARCHAR(10), 
  accesorios JSON,               
  luces_sistemas JSON,          
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);


CREATE TABLE mechanical_parts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    part_number VARCHAR(50) NOT NULL UNIQUE,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL,                
    driver_lastname VARCHAR(100) NOT NULL,            
    driver_identification VARCHAR(50) NOT NULL UNIQUE, 
    driver_email VARCHAR(100) NOT NULL UNIQUE,        
    driver_phone VARCHAR(20) NOT NULL UNIQUE,         
    driver_license_number VARCHAR(50) NOT NULL UNIQUE, 
    driver_license_type VARCHAR(20) NOT NULL,         
    driver_nationality VARCHAR(50) NOT NULL,          -- Nacionalidad
    driver_birthdate DATE NOT NULL,                   -- Fecha de nacimiento
    driver_license_issue_date DATE NOT NULL,          -- Fecha de expedición
    driver_license_expiration_date DATE NOT NULL,     -- Fecha de vencimiento
    driver_portfolio_number VARCHAR(50) NOT NULL UNIQUE, -- Número de portafolio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    client_ruc VARCHAR(20) NOT NULL UNIQUE,
    client_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exit_orders (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    client_id INT NOT NULL,
    exit_date DATE NOT NULL,
    exit_time TIME NOT NULL,
    entry_date DATE NOT NULL,
    entry_time TIME NOT NULL,
    exit_reason TEXT,
    duration_days INT GENERATED ALWAYS AS (DATEDIFF(entry_date, exit_date)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE milages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    mileage INT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE workshop_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    report_date DATE NOT NULL,
    report_time TIME NOT NULL,
    report_details TEXT NOT NULL,
    report_part_details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    user_id INT NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    travel_time TIME, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE observations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_license_plate VARCHAR(20) NOT NULL,
    vehicle_brand VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(50) NOT NULL,
    vehicle_year YEAR NOT NULL,
    vehicle_color VARCHAR(50) NOT NULL,
    person_name VARCHAR(100) NOT NULL,
    person_lastname VARCHAR(100) NOT NULL,
    person_identification VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    observation_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_name VARCHAR(100) NOT NULL,
    contact_lastname VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    contact_enterprise VARCHAR(100),
    contact_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);