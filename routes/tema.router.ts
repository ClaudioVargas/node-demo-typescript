import { Router } from "express";
import { deleteTema, getTema, getTemas, postTema } from "../controllers/tema.controller";
// import ValidateCreate from "../validators/user.validator";

const router = Router()

// endpoint
router.get('/', getTemas)
router.get('/:id', getTema)
router.post('/', postTema)
// router.put('/', ValidateCreate, putTema)
router.delete('/:id', deleteTema)


export default router;