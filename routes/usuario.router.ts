import { Router } from "express";
import { deleteUsuario, getUsuario, getUsuarios, postLikeTema, postUsuario, putUsuario } from "../controllers/usuarios.controller";
import ValidateCreate from "../validators/user.validator";

const router = Router()

// endpoint
router.get('/', getUsuarios)
router.get('/:id', getUsuario)
router.post('/', ValidateCreate, postUsuario)
router.post('/addTema', postLikeTema)
router.put('/', ValidateCreate, putUsuario)
router.delete('/:id', deleteUsuario)


export default router;