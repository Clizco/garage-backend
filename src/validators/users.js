import { check } from "express-validator";
import { validateResult } from "../helpers/validateHelpers.js";

const validateCreate = [
    // USER FIRSTNAME VALIDATION
    check('first_name')
    .custom((value) => {
        return value.match(/^[A-Za-z ]+$/);
      })
      .withMessage('Do not use special characters within the name'),
    
    // USER LASTNAME VALIDATION
    check('last_name')
    .custom((value) => {
        return value.match(/^[A-Za-z ]+$/);
    })
        .withMessage('Do not use special characters within the name'),



    // USER EMAIL VALIDATION
    check('user_email')
    .isEmail()
    .withMessage('Please enter valid email'),
            (req, res, next) => {
        validateResult(req, res, next);

    },

    check('user_password'),

    check('birth_date'),


    check('user_phone')
        .custom((value) => {
        return value.match(/^[1-1-10 ]+$/);

      }).withMessage('Do not use special characters within the name')
        .isNumeric()
        .withMessage('Please only enter numbers')
        .isLength({ min: 8, max: 8 })
        .withMessage('Please enter minimun 8 characters or maximun 8 characters'),

       
    

    

]

export { validateCreate }
