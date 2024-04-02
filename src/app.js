import dotenv from "dotenv";
import express, { urlencoded } from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import accountRouter from './routes/customer.js';
import cookieParser from "cookie-parser";
import userRouter from "./routes/users.js";

dotenv.config()

// BUG FIX FOR VIEWS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// settings
const expressApp = express()
expressApp.set('view engine', 'ejs');
expressApp.set("port", process.env.PORT || 3000);
expressApp.set('views', path.join(__dirname, 'views'));

// middleware that logs the IP
accountRouter.use((req, res, next) => {
    console.log(req.ip);
  
    next();
}); 

// middlewares

expressApp.use(morgan('dev'));
expressApp.use(express.urlencoded({ extended: false }));
expressApp.use(cookieParser())
expressApp.use(express.text())
expressApp.use(express.json())

// routes
expressApp.use("/customer", accountRouter)
expressApp.use("/users", userRouter)

// static files
expressApp.use(express.static(path.join(__dirname, 'public')))

// starting the server
export default expressApp;