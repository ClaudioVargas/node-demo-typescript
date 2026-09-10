import { Tema } from "../models/tema.model";
import { logger } from "../utils/logger";

const CONTEXT = "TemaRepository";

export async function findTemas() {
  try {
    const temas = await Tema.findAll();
    logger.info(CONTEXT, `Listado de temas: ${temas.length} encontrados`);
    return temas;
  } catch (error) {
    logger.error(CONTEXT, "Error al listar temas", error);
    throw error;
  }
}

export async function findTema(id: string) {
  try {
    const tema = await Tema.findByPk(id);
    if (!tema) {
      logger.warn(CONTEXT, "Tema no encontrado por id", { id });
      return null;
    }
    logger.info(CONTEXT, "Tema obtenido", { id, name: tema.name });
    return tema;
  } catch (error) {
    logger.error(CONTEXT, "Error al obtener tema", { id, error });
    throw error;
  }
}

export async function createTema(body: any) {
  try {
    await Tema.sync();
    const tema = new Tema(body);
    if (await Tema.findOne({ where: { name: tema.name } })) {
      logger.warn(CONTEXT, "Intento de crear tema con nombre duplicado", { name: tema.name });
      return null;
    }
    body.createdAt = new Date();
    body.updatedAt = new Date();
    body.isActive = true;
    const creado = await Tema.create(body);
    logger.info(CONTEXT, "Tema creado", { id: creado.id, name: creado.name });
    return creado;
  } catch (error) {
    logger.error(CONTEXT, "Error al crear tema", { body, error });
    throw error;
  }
}

export async function updateTema(body: any) {
  try {
    const tema = await Tema.findByPk(body.id);
    if (!tema) {
      logger.warn(CONTEXT, "Intento de actualizar tema inexistente", { id: body.id });
      return false;
    }
    body.updatedAt = new Date();
    tema.set(body);
    await tema.save();
    logger.info(CONTEXT, "Tema actualizado", { id: body.id, name: body.name });
    return true;
  } catch (error) {
    logger.error(CONTEXT, "Error al actualizar tema", { id: body.id, body, error });
    throw error;
  }
}

export async function deleteTema(id: string): Promise<boolean> {
  try {
    const tema = await Tema.findByPk(id);
    if (!tema) {
      logger.warn(CONTEXT, "Intento de eliminar tema inexistente", { id });
      return false;
    }
    await tema.destroy();
    logger.info(CONTEXT, "Tema eliminado", { id });
    return true;
  } catch (error) {
    logger.error(CONTEXT, "Error al eliminar tema", { id, error });
    throw error;
  }
}