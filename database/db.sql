-- Creando la base de datos --
CREATE DATABASE customers;

-- Accediendo a la base de datos --
use customers;

-- Creando la tabla --
CREATE TABLE customer (
    id INT(6) AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    user_email VARCHAR(190) UNIQUE NOT NULL,
    user_password VARBINARY(20) NOT NULL,
    birth_date DATE NOT NULL,
    user_phone INT(10) UNIQUE NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- to show all tables --
show tables;

-- to describe table --
describe customer;