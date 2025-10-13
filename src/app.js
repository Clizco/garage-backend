import dotenv from "dotenv";
import express from 'express';
import path from "path";
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import userRouter from "./routes/User/usersRoutes.js"
import rolesRouter from "./routes/Roles/rolesRoutes.js";
import provincesRouter from "./routes/Provinces/provincesRoutes.js";
import accountsRouter from "./routes/Account/accountRoutes.js"
import vehicleRouter from "./routes/Vehicles/vehiclesRoutes.js";
import vehicleInspectionRouter from "./routes/VehicleInspection/vehicleInspectionRoutes.js";
import partsRouter from "./routes/Parts/partsRoutes.js";
import driversRouter from "./routes/Drivers/driversRoutes.js";
import clientsRouter from "./routes/Clients/clientsRouter.js";
import exitOrdersRouter from "./routes/ExitOrders/exitordersRoutes.js";
import milageRouter from "./routes/Mileages/milleagesRoutes.js";
import workshopReportRouter from "./routes/WorkshopReport/workshopreportRoutes.js";
import routesRouter from "./routes/Routes/routesRoutes.js";
import observationsRouter from "./routes/Observations/observationsRoutes.js";
import contactsRouter from "./routes/Contacts/contactsRoutes.js";

dotenv.config();

// BUG FIX FOR VIEWS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// settings
const expressApp = express();
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

// Ensure uploads folders exist
const uploadsBasePath = path.resolve(__dirname, '../uploads');
const requiredFolders = [
  uploadsBasePath,
  path.join(uploadsBasePath, 'drivers'),
  path.join(uploadsBasePath, 'drivers', 'tmp'),
  path.join(uploadsBasePath, 'vehicles'),
  path.join(uploadsBasePath, 'parts')
];

requiredFolders.forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`🗂️ Created folder: ${folder}`);
  }
});

// static files
expressApp.use(express.static(path.join(__dirname, 'public')));
console.log('🛠️ Serving static from:', uploadsBasePath.replace(/\\/g, '/'));
expressApp.use('/uploads', express.static(uploadsBasePath));

// routes
expressApp.use("/users", userRouter);
expressApp.use("/roles", rolesRouter);
expressApp.use("/provinces", provincesRouter);
expressApp.use("/vehicles", vehicleRouter);
expressApp.use("/vehicle-inspections", vehicleInspectionRouter);
expressApp.use("/parts", partsRouter);
expressApp.use("/drivers", driversRouter);
expressApp.use("/clients", clientsRouter);
expressApp.use("/exit-orders", exitOrdersRouter);
expressApp.use("/milages", milageRouter);
expressApp.use("/workshop-reports", workshopReportRouter);
expressApp.use("/routes", routesRouter);
expressApp.use("/observations", observationsRouter);
expressApp.use("/contacts", contactsRouter);

// starting the server
export default expressApp;
