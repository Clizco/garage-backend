import {Router } from "express";
import { validateCreate } from "../validators/users.js";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import config from "../config.js";
import bcrypt from "bcrypt"


const userRouter = Router()

// middleware that logs the IP
userRouter.use((req, res, next) => {
    console.log(req.ip) 
    next();
})


//se encarga de traer un usuario atraves de un correo
userRouter.get("/:email", async (req, res) => {
    try{

        const User = req.params.email;

        const [results] = await pool.query("SELECT * FROM customer WHERE user_email = ?", [User] )
    
        return res.status(200).json(results)

    } catch (error){
        console.error(error)
    }

    

})


//se encarga de traer todos los usuarios en la base de datos
userRouter.get("/customers/all", async (req, res) => {

    const [rows] = await pool.query("SELECT id, created_at, first_name, last_name, user_email, birth_date, user_phone, updated_at FROM customer")
    return res.status(200).json(rows)

})



//se encarga de crear los usuarios
userRouter.post("/signup/", validateCreate, async (req, res) => {
    try {

        bcrypt.genSalt(10, async(err, salt) => {
            bcrypt.hash(req.body.user_password, salt, async(err, hash) => {

                const newUser =({ 
                                "first_name":req.body.first_name,
                                "last_name":req.body.last_name, 
                                "user_email":req.body.user_email, 
                                "user_password":hash, 
                                "birth_date":req.body.birth_date, 
                                "user_phone":req.body.user_phone 
                                })
            
            
                if (!newUser){
                    res.status(401).send("Por favor ingrese todos los datos del usuario")
                }
                const token = jwt.sign({id: newUser._id}, config.secret, {
                    expiresIn: 60 * 60 * 24
                })

                const result = await pool.query("INSERT INTO customer set ?", [newUser]);
                
                
                res.json({auth: true, result, token}); 
            });
        });

    } catch (error) {
        console.error(error)
        res.status(500)
        res.send(error.message)
    }
    
});


//inicio de sesion de los usuarios --- 100%
userRouter.post("/signin/", async (req, res) => {
    try {
        const email = req.body.user_email;
        const password = req.body.user_password;
        const query = "SELECT * FROM customer WHERE user_email = ?";
        const [currentUser] = await pool.query(query, [email]);
        const user =  currentUser[0]

        if(!email){
            res.status(401).send("Falta el correo !!")
        }else if(!password){
            res.status(401).send("Falta la contrasena !!")
        } else if (currentUser == 0) {
            res.status(401).send("El usuario no se encuentra registrado, porfavor registrese");    
        } else {
            const token = jwt.sign({id: user._id}, config.secret, { expiresIn: 60 * 60 * 24 });
            const result = bcrypt.compareSync(password, user.user_password);
            if (!result){
                res.status(401).send({auth: result, message: "La contrasena es incorrecta, porfavor verificala"})
            } else {
                res.json({auth: result, message: `Contrasena correcta, bienvenido ${email} `, token});
            }
        }

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

        
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(req.body.user_password, salt, function(err, hash){

                const newCustomer = ({ 
                    "first_name":req.body.first_name,
                    "last_name":req.body.last_name, 
                    "user_email":req.body.user_email, 
                    "user_password":hash, 
                    "birth_date":req.body.birth_date, 
                    "user_phone":req.body.user_phone 
                    })
                
                if (!newCustomer){
                        res.status(401).send("Por favor ingrese todos los datos del usuario")
                }
        
                const result = pool.query("UPDATE customer set ? WHERE id = ?", [newCustomer, id])
        
                res.json({updated: true, result}); 
                
            });
        });

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




