import express, { urlencoded } from 'express';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import mysql from "mysql";
import myConnection from "express-myconnection";
import morgan from 'morgan';
import accountRouter from './routes/customer.js';



dotenv.config()

// relleno 

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// settings
const PORT = process.env.PORT || 3000;
const expressApp = express()
expressApp.set('view engine', 'ejs');
expressApp.set('views', path.join(__dirname, 'views'));

// middlewares

expressApp.use(morgan('dev'));
expressApp.use(myConnection(mysql, {
  host: "127.0.0.1",
  user: "root",
  database: 'customers',
  password: "Legolas*27!",
  port: 3306
  
}, 'single'));
expressApp.use(express.urlencoded({extended: false}));

// routes
expressApp.use("/", accountRouter)

// static files
expressApp.use(express.static(path.join(__dirname, 'public')))



// Starting the server
const bootsrap = async () => {
    expressApp.listen(PORT, ()=> 
     console.log(`Servidor levantado en puerto ${PORT}`)
     );
}

bootsrap()
