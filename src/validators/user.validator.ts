import { check } from 'express-validator'
import validateResult from './validateHelper'

const ValidateCreate = [
    check('name')
    .exists()
    .not()
    .isEmpty(),

    check('email')
    .exists()
    .isEmail(), 

    (req: any, res: any, next: any) => {
        validateResult(req, res, next)
    }
] 

// Para actualizar: no se exige ni se valida el email (no es modificable en PUT)
const ValidateUpdate = [
    check('name')
    .exists()
    .not()
    .isEmpty(),

    check('email')
    .optional()
    .isEmail(), 

    (req: any, res: any, next: any) => {
        validateResult(req, res, next)
    }
] 

export default ValidateCreate
export { ValidateUpdate }