import {Router } from "express";
import { validateCreate } from "../validators/users.js";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import config from "../config.js";
import bcrypt from "bcryptjs"

const saltRounds = 10;

const userRouter = Router()

// middleware that logs the IP
userRouter.use((req, res, next) => {
    console.log(req.ip) 
    next();
})


//se encarga de traer un usuario atraves de un correo
userRouter.get("/:email", async (req, res) => {

    const User = req.params.email;

    const [results] = await pool.query("SELECT * FROM customer WHERE user_email = ?", [User] )
    return res.status(200).json(results)

})


//se encarga de traer todos los usuarios en la base de datos
userRouter.get("/customers/all", async (req, res) => {

    const [rows] = await pool.query("SELECT * FROM customer")
    return res.status(200).json(rows)

})

//se encarga de verificar el token de los usuarios
userRouter.get("/users/token", async (req, res) => {

    const token = req.header['x-access-token'];
    if (!token) {
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        })
    }

    const decoded = jwt.verify(token, config.secret);
    const user = await newUser.findByid(decoded._id, {password: 0})
    if(!user){
        return res.status(404).send('No user found')
    }

    res.json(user)

})

//se encarga de crear los usuarios
userRouter.post("/signup/", validateCreate, async (req, res) => {

    const password = req.body.user_password;
    const encryptedPassword = await bcrypt.hash(password, saltRounds)

    const newUser = ({ "first_name":req.body.first_name,
                       "last_name":req.body.last_name, 
                       "user_email":req.body.user_email, 
                       "user_password":encryptedPassword, 
                       "birth_date":req.body.birth_date, 
                       "user_phone":req.body.user_phone 
                    })

  
                    
    const token = jwt.sign({id: newUser._id}, config.secret, {
        expiresIn: 60 * 60 * 24
    })



    const result = await pool.query("INSERT INTO customer set ?", [newUser]);
        
        
    res.json({auth: true, result, token}); 
    
});


//inicio de sesion de los usuarios
userRouter.post("/signin/", async (req, res) => {

    const { user_email, user_password} = req.body

    const result =  await pool.query(`SELECT * FROM customer WHERE user_email = '${user_email}' AND user_password '${user_password}'`);
    if (err) throw err;
    if (result.length > 0) {
        res.json(200)
    } else {
        res.send('Invalid login credentials');
    }
});

//delete users
userRouter.delete("/delete/:email", async(req, res) => {
    try{

        const User = req.params.email;

        const result = await pool.query("DELETE FROM customer WHERE user_email = ?", [User]);
        
        res.json(result)

    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
})

export default userRouter;




