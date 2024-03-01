import express, { urlencoded } from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import accountRouter from './routes/customer.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// settings
const expressApp = express()
expressApp.set('view engine', 'ejs');
expressApp.set("port", process.env.PORT || 3000);
expressApp.set('views', path.join(__dirname, 'views'));

// middlewares

expressApp.use(morgan('dev'));
expressApp.use(express.urlencoded({ extended: false }));

// routes
expressApp.use("/", accountRouter)

// static files
expressApp.use(express.static(path.join(__dirname, 'public')))

// starting the server
export default expressApp;