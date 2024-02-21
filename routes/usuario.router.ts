import { Router } from "express";
import { deleteUsuario, getUsuario, getUsuarios, postUsuario, putUsuario } from "../controllers/usuarios.controller";
import ValidateCreate from "../validators/user.validator";

const router = Router()

// endpoint
router.get('/', getUsuarios)
router.get('/:id', getUsuario)
router.post('/', ValidateCreate, postUsuario)
router.put('/', ValidateCreate, putUsuario)
router.delete('/:id', deleteUsuario)


export default router;