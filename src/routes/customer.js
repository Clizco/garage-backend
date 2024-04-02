import { Router } from 'express';
import {
    createCustomers,
    deleteCustomer,
    editCustomer,
    loginCustomer,
    renderCustomers,
    updateCustomer,
} from "../controllers/customerController.js";

const accountRouter = Router()


// middleware that logs the IP
accountRouter.use((req, res, next) => {
    console.log(req.ip) 
    next();
})
 

// RUTAS SISTEMA INTERNO
accountRouter.get('/', renderCustomers);
accountRouter.post('/add', createCustomers);
accountRouter.post('/login', loginCustomer)
accountRouter.get('/update/:id', editCustomer);
accountRouter.post('/update/:id', updateCustomer);
accountRouter.get('/delete/:id', deleteCustomer);


// RUTAS PARA LOS EJS
accountRouter.get('/signup', function(req, res){
    res.render('pages/signup', {title: 'Signup Page'})
});

accountRouter.get('/login', function(req, res){
    res.render('pages/login', {title: 'Login Page'})
});


export default accountRouter;