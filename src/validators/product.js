import { body, validationResult } from 'express-validator';


const productValidator = [
    body('name')
        .notEmpty()
        .withMessage('El nombre del producto es requerido')
        .isLength({ max: 50 })
        .withMessage('El nombre del producto no puede tener más de 50 caracteres'),
    body('price')
        .notEmpty()
        .withMessage('El precio del producto es requerido')
        .isNumeric()
        .withMessage('El precio del producto debe ser un número'),
    body('description')
        .optional()
        .isLength({ max: 200 })
        .withMessage('La descripción del producto no puede tener más de 200 caracteres'),
    body('userId')
        .notEmpty()
        .withMessage('El ID del usuario es requerido')
        .custom(async (value) => {
            const user = await userValidator.getUserById(value);
            if (!user) {
                throw new Error('El usuario no existe');
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

export default productValidator;