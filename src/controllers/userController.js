import { pool } from "../db.js"
import jwt from "jsonwebtoken"
import { jwtDecode } from "jwt-decode"
import config from "../config.js"


//Encargada de traer un solo usuario dentro de la base de datos
export const getUser = async (req, res) => {

    const User = req.params.email ;

    const [results] = await pool.query("SELECT * FROM  customer WHERE user_email = ?", [User] )
    return res.status(200).json(results)
}

// Encargada de traer todos los usuarios dentro de la base de datos
export const getUsers = async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM customer");
    return res.status(200).json(rows)
}

// Encargada de crear usuarios en la base de datos
export const createUser = async (req, res) => {
    try {
     const { first_name, last_name, user_email, user_password, birth_date, user_phone} = req.body

     const newUser = ({ first_name, last_name, user_email, user_password, birth_date, user_phone })
    

     const result = await pool.query("INSERT INTO customer set ?", [newUser]);
     
     
     res.json(result);
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

export const deleteUser = async (req, res) => {

}
 