import {Router } from "express";
import { validateCreate } from "../validators/users.js";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import config from "../config.js";
import bcrypt from "bcrypt"
import mysql from "mysql"
 
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

    bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(req.body.user_password, salt, function(err, hash){

        const newUser = ({ "first_name":req.body.first_name,
                           "last_name":req.body.last_name, 
                           "user_email":req.body.user_email, 
                           "user_password":hash, 
                           "birth_date":req.body.birth_date, 
                           "user_phone":req.body.user_phone 
                        })
    
      
                        
        const token = jwt.sign({id: newUser._id}, config.secret, {
            expiresIn: 60 * 60 * 24
        })

        const result = pool.query("INSERT INTO customer set ?", [newUser]);
        
        
        res.json({auth: true, result, token}); 


        })

        

    })

    
});


//inicio de sesion de los usuarios
userRouter.post("/signin/", async (req, res) => {
    try {
    

    const email = req.body.user_email;
    const password = req.body.user_password;

    const query = "SELECT * FROM customer WHERE user_email = ?";


    const [currentUser] = await pool.query(query, [email]);
    // console.log(currentUser)

    if(!currentUser){
        res.status(401).send("Credenciales incorrectas");
        return;
    }
    
    const user = currentUser[0]
    // console.log(user)
    const result = await bcrypt.compareSync(password, user.user_password);

    console.log(result)
    if(!result) {
        res.status(401)
        res.send("Credenciales incorrectas");
        return;
    }
 
    res.status(201)
    res.send("Inicio de sesion exitoso");
    console.log(user)
    } catch(error){
        console.error(error)
        res.status(500)
        res.send("Error interno del servidor")

    }
});



//actualizacion de los datos de un usuario
userRouter.post("/update/:id", async(req, res) => {
    try {
    const { id } = req.params;
    
    const newCustomer = req.body;

    const result = await pool.query("UPDATE customer set ? WHERE id = ?", [newCustomer, id])

    res.json(result)

    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
})


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




