import { Post } from "../models/post.model";
import { Tema } from "../models/tema.model";
import { logger } from "../utils/logger";

const CONTEXT = "PostRepository";

export async function findPosts() {
  try {
    const posts = await Post.findAll();
    logger.info(CONTEXT, `Listado de posts: ${posts.length} encontrados`);
    return posts;
  } catch (error) {
    logger.error(CONTEXT, "Error al listar posts", error);
    throw error;
  }
}
export async function findPost(id: string) {
  try {
    const post = await Post.findByPk(id);
    if (!post) {
      logger.warn(CONTEXT, "Post no encontrado por id", { id });
      return null;
    }
    logger.info(CONTEXT, "Post obtenido", { id });
    return post;
  } catch (error) {
    logger.error(CONTEXT, "Error al obtener post", { id, error });
    throw error;
  }
}
export async function createPost(body: any) {
  try {
    await Post.sync();
    body.createdAt = new Date();
    body.updatedAt = new Date();
    const post = await Post.create(body);
    logger.info(CONTEXT, "Post creado", { id: post.id });
    return post;
  } catch (error) {
    logger.error(CONTEXT, "Error al crear post", { body, error });
    throw error;
  }
}
export async function updatePost(body: any) {
  try {
    const post = await Post.findByPk(body.id);
    if (!post) {
      logger.warn(CONTEXT, "Intento de actualizar post inexistente", { id: body.id });
      return false;
    }
    body.updatedAt = new Date();
    post.set(body);
    await post.save();
    logger.info(CONTEXT, "Post actualizado", { id: body.id });
    return true;
  } catch (error) {
    logger.error(CONTEXT, "Error al actualizar post", { id: body.id, body, error });
    throw error;
  }
}
export async function findPostsByUsuario(id: string) {
  try {
    const posts = await Post.findAll({
      where: { usuarioId: id },
      include: [{ model: Tema, through: { attributes: [] } }]
    });
    logger.info(CONTEXT, `Posts del usuario ${id}: ${posts.length} encontrados`);
    return posts;
  } catch (error) {
    logger.error(CONTEXT, "Error al listar posts por usuario", { id, error });
    throw error;
  }
}
