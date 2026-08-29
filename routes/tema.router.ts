import { Router } from "express";
import { deleteTema, getTema, getTemas, postTema } from "../controllers/tema.controller";

const router = Router();

router.get('/', getTemas)
router.get('/:id', getTema)
router.post('/', postTema)
router.delete('/:id', deleteTema)

export default router;
