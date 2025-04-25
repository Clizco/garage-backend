-- Creando la base de datos --
CREATE DATABASE petro;

-- Accediendo a la base de datos --
use PMDB;


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
    user_province INT NOT NULL,
    user_password VARCHAR(60) NOT NULL,
    user_phonenumber VARCHAR(45) NOT NULL UNIQUE,
    user_unique_id VARCHAR(45) NOT NULL UNIQUE,
    user_address INT,
    role_id INT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_province) REFERENCES provinces(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_address) REFERENCES address(id) ON DELETE CASCADE ON UPDATE CASCADE
);



CREATE TABLE provinces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    province_name VARCHAR(45) NOT NULL,
    created_at VARCHAR(45) NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE shipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shipment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shipment_status VARCHAR(45) NOT NULL,
    shipment_origin INT NOT NULL,
    shipment_destination INT NOT NULL,
    shipment_sender_name VARCHAR(45) NOT NULL,
    shipment_sender_phonenumber VARCHAR(45) NOT NULL,
    shipment_receiver_name VARCHAR(45) NOT NULL,
    shipment_receiver_phonenumber VARCHAR(45) NOT NULL,
    shipment_description VARCHAR(255) NOT NULL,
    shipment_code VARCHAR(45) NOT NULL UNIQUE,
    shipment_assigned_user VARCHAR (45), 
    shipment_user INT NOT NULL,
    FOREIGN KEY (shipment_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE address (
    id INT AUTO_INCREMENT PRIMARY KEY,
    address_person_fullname VARCHAR(45) NOT NULL,
    address_phonenumber VARCHAR(45) NOT NULL,
    address_details VARCHAR(45) NOT NULL,
    address_province INT NOT  NULL,
    address_user INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (address_province) REFERENCES provinces(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (address_user) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
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

-- Accediendo a la tablas --
use users;
use roles;

-- to show all tables --
show tables;

-- to describe table --
describe users; 