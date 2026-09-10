import { Router } from "express";
import { deleteRole, getRoles, postRole, putRole } from "../controllers/role.controller";

const router = Router();

router.get('/', getRoles)
router.post('/', postRole)
router.put('/:id', putRole)
router.delete('/:id', deleteRole)

export default router;
