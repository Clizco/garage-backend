import { Router } from 'express';
import controller from '../controllers/customerController.js';

const accountRouter = Router()

// middleware that logs the IP
accountRouter.use((req, res, next) => {
    console.log(req.ip)

    next();
})

// get customer
accountRouter.get('/', controller.list);

// post customer
accountRouter.post('/add', controller.save);

// delete customer
accountRouter.get('/delete/:id', controller.delete);

// update customer
accountRouter.get('/update/:id', controller.edit);
accountRouter.post('/update/:id', controller.update);
export default accountRouter;