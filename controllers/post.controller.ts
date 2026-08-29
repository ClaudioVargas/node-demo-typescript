import { Request, Response } from "express";
import { findPosts, findPost, createPost, updatePost, findPostsByUsuario } from "../repository/post.repository";
export const getPosts = async (_req: Request, res: Response) => res.status(200).json({ data: await findPosts() });
export const getPost = async (req: Request, res: Response) => {
  const { id } = req.params; const post = await findPost(id);
  if (!post) return res.status(404).json({ msg: "Post con id " + id + " no encontrado" });
  return res.json({ data: post });
};
export const postPost = async (req: Request, res: Response) => {
  try { return res.status(201).json({ msg: await createPost(req.body) }); }
  catch (error) { return res.status(500).json({ msg: "Contecte con el administrador" }); }
};
export const putPost = async (req: Request, res: Response) => {
  try {
    if (await updatePost(req.body)) return res.json({ src: "post editado correctamente" });
    return res.status(409).json({ msg: "Post con id " + req.body.id + "no exisete" });
  } catch (error) { return res.status(500).json({ msg: "Conecte con el administrador", error }); }
};
export const deletePost = (req: Request, res: Response) => res.json({ msg: "deletePost", id: req.params.id });
export const getPostsByUsuario = async (req: Request, res: Response) => {
  try {
    const posts = await findPostsByUsuario(req.params.id);
    if (!posts || posts.length === 0) return res.status(404).json({ msg: "No se encontraron posts para el usuario con id " + req.params.id });
    return res.status(200).json({ data: posts });
  } catch (error) { return res.status(500).json({ msg: "Conecte con el administrador", error }); }
};
