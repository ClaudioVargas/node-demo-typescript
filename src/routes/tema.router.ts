import { Router } from "express";
import { eliminarTema, getTema, getTemas, postTema, putTema } from "../controllers/tema.controller";

const router = Router();

router.get('/', getTemas)
router.get('/:id', getTema)
router.post('/', postTema)
router.put('/:id', putTema)
router.delete('/:id', eliminarTema)

export default router;
