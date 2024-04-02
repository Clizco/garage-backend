import { check } from 'express-validator';
import { validateResult } from '../helpers/validateHelpers.js';

const validateUpdate = [

    // name validation
    check('firstname')
    .custom((value) => {
        return value.match(/^[A-Za-z ]+$/);
      })
      .withMessage('Do not use special characters within the name'),
    
    // lastname validation
    check('lastname')
    .custom((value) => {
        return value.match(/^[A-Za-z ]+$/);
      })
      .withMessage('Do not use special characters within the name'),

    // phone validation
    check('phone')
    .isNumeric()
    .withMessage('Please only enter numbers')
    .isLength({ min: 8, max: 8 })
    .withMessage('Please enter minimun 8 characters or maximun 8 characters'),

    // dateofbirth 
    check('dateofbirth')
    .not()
    .isDate()
    .withMessage('Please enter valid dateofbirth'),

    // Validacion del email
    check('email')
    .exists()
    .isEmail()
    .withMessage('Please enter valid email'),
            (req, res, next) => {
        validateResult(req, res, next);

    }

]

export { validateUpdate }
