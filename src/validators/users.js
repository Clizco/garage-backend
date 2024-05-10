import { body, check } from "express-validator";
import { validateResult } from "../helpers/validateHelpers.js";

const validateCreate = [
   
    // first_name validation
    check('first_name').not().isEmpty().custom((value) => { return value.match(/^[A-Za-z ]+$/); }).withMessage('Do not use special characters within the name'), (req, res, next) => { validateResult(req, res, next); },
    
    // last_name validation
    check('last_name').not().isEmpty().custom((value) => { return value.match(/^[A-Za-z ]+$/); }).withMessage('Do not use special characters within the name'), (req, res, next) => { validateResult(req, res, next); },

    // user_email validation
    check('user_email').isEmail().withMessage('Please enter valid email'), (req, res, next) => { validateResult(req, res, next); } ,

    // user_password validation
    check('user_password'),

    // birth_date validation
    check('birth_date').not().isEmpty().withMessage('please fill this camp').toDate().optional({ checkFalsy: true}).withMessage('Please enter valid dateofbirth'), (req, res, next) => { validateResult(req, res, next); },

    // user_phone validation
    check('user_phone').not().isEmpty().custom((value) => { return value.match(/^[0-9 ]*$/); }).withMessage('Do not use special characters within the name'), (req, res, next) => { validateResult(req, res, next); },

]

export { validateCreate }
