import { check } from "express-validator";
import { validateResult } from "../helpers/validateHelpers.js";

const validateCreate = [
    check('driver_name')
        .notEmpty().withMessage('El nombre es requerido')
        .matches(/^[A-Za-z ]+$/).withMessage('No uses caracteres especiales en el nombre'),
    
    check('driver_email')
        .isEmail().withMessage('Ingresa un correo válido'),
    
    check('driver_password')
        .isStrongPassword().withMessage('Usa una contraseña más fuerte (mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos)'),
    
    check('driver_phonenumber')
        .notEmpty().withMessage('El número de teléfono es requerido')
        .matches(/^[0-9]+$/).withMessage('Solo números son permitidos en el teléfono'),

    check('driver_province')
        .notEmpty().withMessage('La provincia es requerida')
        .isInt().withMessage('La provincia debe ser un número'),

    (req, res, next) => { validateResult(req, res, next); }
];

export { validateCreate };
