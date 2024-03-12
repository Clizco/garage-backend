import { Router } from 'express';
import {
    createCustomers,
    deleteCustomer,
    editCustomer,
    loginCustomer,
    renderCustomers,
    updateCustomer,
} from "../controllers/customerController.js";
import {
    getUsers,
    createUser,
    getUser,
} from "../controllers/userController.js"
import { validateCreate } from "../validators/users.js"

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


// RUTAS API
accountRouter.get('/users/:email', getUser)
accountRouter.get('/users/all', getUsers);
accountRouter.post('/signup/', createUser);
accountRouter.get('/delete/:id')




// RUTAS PARA LOS EJS
accountRouter.get('/signup', function(req, res){
    res.render('pages/signup', {title: 'Signup Page'})
});

accountRouter.get('/login', function(req, res){
    res.render('pages/login', {title: 'Login Page'})
});


export default accountRouter;