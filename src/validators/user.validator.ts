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

export default ValidateCreate