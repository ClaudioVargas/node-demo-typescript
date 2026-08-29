import { Router } from "express";
import { deletePost, getPost, getPosts, getPostsByUsuario, postPost, putPost } from "../controllers/post.controller";

const router = Router();

router.get('/', getPosts)
router.get('/:id', getPost)
router.get('/posts/:id', getPostsByUsuario)
router.post('/', postPost)
router.delete('/:id', deletePost)

export default router;
