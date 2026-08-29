import { Router } from "express";
import { deleteRole, getRoles, postRole } from "../controllers/role.controller";

const router = Router();

router.get('/', getRoles)
router.post('/', postRole)
router.delete('/:id', deleteRole)

export default router;
