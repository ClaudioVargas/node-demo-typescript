import { Router } from "express";
// import ValidateCreate from "../validators/user.validator";
import { deletePost, getPost, getPosts, getPostsByUsuario, postPost, putPost } from "../controllers/post.controller";

const router = Router()

// endpoint
router.get('/', getPosts)
router.get('/:id', getPost)
router.get('/posts/:id', getPostsByUsuario)

router.post('/', postPost)
// router.put('/', ValidateCreate, putPost)
router.delete('/:id', deletePost)

export default router;