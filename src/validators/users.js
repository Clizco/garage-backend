import { check } from "express-validator";
import { validateResult } from "../helpers/validateHelpers.js";

const validateCreate = [
    
    // firstname validation
    check('first_name')
    .not()
    .isEmpty()
    .withMessage('please fill this camp')
    .exists(),

    // lastname validation
    check('last_name')
    .not()
    .isEmpty()
    .withMessage('please fill this camp')
    .exists()
    .withMessage ('Lastname is required')
    .isLength({ min: 5, max: 20})
    .withMessage('Please enter minimum 8 characters or maximun 20 characters  '),

    // email validation
    check('user_email')
    .exists()
    .withMessage('El email ya se encuentra registrado')
    .isEmail()
    .withMessage('Please enter valid email'),
            (req, res, next) => {
        validateResult(req, res, next);

    },

    // phone validation
    check('user_phone')
    .not()
    .isEmpty()
    .withMessage('please fill this camp')
    .exists().withMessage("el telefono ya esta registrado")
    .isNumeric()
    .withMessage('Please only enter numbers')
    .isLength({ min: 8, max: 8 })
    .withMessage('Please enter minimun 8 characters or maximun 8 characters'),

    // birthdate  validation
    check('birth_date')
    .not()
    .isEmpty()
    .withMessage('please fill this camp')
    .toDate()
    .optional({ checkFalsy: true})
    .withMessage('Please enter valid dateofbirth'),

]

export { validateCreate }
