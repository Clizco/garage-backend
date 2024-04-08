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

    check('user_phone')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('Only numbers')

       
    

    

]

export { validateCreate }
