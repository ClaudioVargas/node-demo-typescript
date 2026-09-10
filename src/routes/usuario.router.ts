import { Router } from "express";
import { eliminarUsuario, getUsuario, getUsuarios, postLikeTema, postUsuario, putUsuario } from "../controllers/usuarios.controller";
import ValidateCreate, { ValidateUpdate } from "../validators/user.validator";

const router = Router()

router.get('/', getUsuarios)
router.get('/:id', getUsuario)
router.post('/', ValidateCreate, postUsuario)
router.post('/addTema', postLikeTema)
router.put('/', ValidateUpdate, putUsuario)
router.delete('/:id', eliminarUsuario)

export default router;