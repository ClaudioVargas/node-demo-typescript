import { Post } from "../models/post.model";
import { Tema } from "../models/tema.model";

export const findPosts = () => Post.findAll();
export const findPost = (id: string) => Post.findByPk(id);
export async function createPost(body: any) {
  await Post.sync();
  body.createdAt = new Date();
  body.updatedAt = new Date();
  return Post.create(body);
}
export async function updatePost(body: any) {
  const post = await Post.findByPk(body.id);
  if (!post) return false;
  body.updatedAt = new Date();
  post.set(body);
  await post.save();
  return true;
}
export const findPostsByUsuario = (id: string) => Post.findAll({
  where: { usuarioId: id },
  include: [{ model: Tema, through: { attributes: [] } }]
});
