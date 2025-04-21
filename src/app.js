import dotenv from "dotenv";
import express, { urlencoded } from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import fs from 'fs';
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/User/usersRoutes.js"
import accountsRouter from "./routes/Account/accountRoutes.js"
import rolesRouter from "./routes/Roles/rolesRoutes.js";
import provincesRouter from "./routes/Provinces/provincesRoutes.js";
import shipmentRouter from "./routes/Shipments/shipmentsRoutes.js";
import calculatorRouter from "./routes/Calculator/calculator.js";
import addressRouter from "./routes/Address/address.js";
import driverRouter from "./routes/Drivers/driversRoutes.js";

dotenv.config()

// BUG FIX FOR VIEWS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)




// settings
const expressApp = express()
expressApp.set('view engine', 'ejs');
expressApp.set("port", process.env.PORT || 3000);
expressApp.set('views', path.join(__dirname, 'views'));

// middleware that logs the IP of users
accountsRouter.use((req, res, next) => {
    console.log(req.ip);
    next();
}); 



// middlewares
expressApp.use(morgan('dev'));
expressApp.use(express.urlencoded({ extended: false }));
expressApp.use(cookieParser());
expressApp.use(express.text());
expressApp.use(express.json());
expressApp.use(cors());

// static files
expressApp.use(express.static(path.join(__dirname, 'public')));
expressApp.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// routes
expressApp.use("/users", userRouter);
expressApp.use("/roles", rolesRouter);
expressApp.use("/provinces", provincesRouter);
expressApp.use("/shipments", shipmentRouter);
expressApp.use("/address", addressRouter);
expressApp.use("/api", calculatorRouter);
expressApp.use("/drivers", driverRouter);

// starting the server
export default expressApp;
