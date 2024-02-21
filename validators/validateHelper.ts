import { validationResult } from "express-validator"; 

const validateResult = (req: any, res: any, next: any) => {
    try {
        validationResult(req).throw()
        return next()
    } catch (errors) {
        res.status(403)
        res.send(errors)
    }
}

export default validateResult