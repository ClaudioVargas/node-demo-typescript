import { hashPassword } from "./auth.repository";
import { Usuario } from "../models/usuario.model";
import { UsuarioTema } from "../models/usuarioTemas.model";
import { Tema } from "../models/tema.model";
import { UpdateUsuarioRequest } from "../interfaces/UpdateUsuarioRequest";
import { logger } from "../utils/logger";

const CONTEXT = "UsuarioRepository";

export async function findUsuarios(): Promise<Usuario[]> {
  try {
    const usuarios = await Usuario.findAll();
    logger.info(CONTEXT, `Listado de usuarios: ${usuarios.length} encontrados`);
    return usuarios;
  } catch (error) {
    logger.error(CONTEXT, "Error al listar usuarios", error);
    throw error;
  }
}
export async function findUsuario(id: string): Promise<Usuario | null> {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      logger.warn(CONTEXT, "Usuario no encontrado por id", { id });
      return null;
    }
    logger.info(CONTEXT, "Usuario obtenido", { id });
    return usuario;
  } catch (error) {
    logger.error(CONTEXT, "Error al obtener usuario", { id, error });
    throw error;
  }
}

export async function createUsuario(body: any): Promise<Usuario | null> {
  try {
    await Usuario.sync({ alter: true });
    if (await Usuario.findOne({ where: { email: body.email } })) {
      logger.warn(CONTEXT, "Intento de crear usuario con email duplicado", { email: body.email });
      return null;
    }
    // Mismo esquema de hashing (PBKDF2, formato `salt$derived`) que usa el login
    // en auth.repository.ts; así las contraseñas de usuarios creados aquí son
    // verificables al iniciar sesión.
    const hashedPassword = hashPassword(body.password);
    const usuario = await Usuario.create({ ...body, password: hashedPassword, createdAt: new Date(), updatedAt: new Date() } as any);
    logger.info(CONTEXT, "Usuario creado", { id: usuario.id, email: body.email });
    return usuario;
  } catch (error) {
    logger.error(CONTEXT, "Error al crear usuario", { email: body.email, error });
    throw error;
  }
}

export async function likeTema(body: any): Promise<{ error: string } | { response: UsuarioTema }> {
  try {
    await UsuarioTema.sync({ alter: true });
    const usuarioTema = new UsuarioTema(body);
    if (!await Tema.findOne({ where: { id: usuarioTema.usuarioId } })) {
      logger.warn(CONTEXT, "Intento de like: usuario destino no existe", { id: usuarioTema.usuarioId });
      return { error: "usuario" };
    }
    if (!await Tema.findOne({ where: { id: usuarioTema.temaId } })) {
      logger.warn(CONTEXT, "Intento de like: tema no existe", { id: usuarioTema.temaId });
      return { error: "tema" };
    }
    if (await UsuarioTema.findOne({ where: { usuarioId: usuarioTema.usuarioId, temaId: usuarioTema.temaId } })) {
      logger.warn(CONTEXT, "Intento de like duplicado", { usuarioId: usuarioTema.usuarioId, temaId: usuarioTema.temaId });
      return { error: "exists" };
    }
    body.createdAt = new Date();
    body.updatedAt = new Date();
    const response = await UsuarioTema.create(body);
    logger.info(CONTEXT, "Like a tema registrado", { usuarioId: usuarioTema.usuarioId, temaId: usuarioTema.temaId });
    return { response };
  } catch (error) {
    logger.error(CONTEXT, "Error al registrar like a tema", { body, error });
    throw error;
  }
}

// Actualiza datos del usuario (NO la contraseña). El `roleId` puede venir en el body.
export async function updateUsuario(body: UpdateUsuarioRequest): Promise<boolean> {
  try {
    const usuario = await Usuario.findByPk(body.id);
    if (!usuario) {
      logger.warn(CONTEXT, "Intento de actualizar usuario inexistente", { id: body.id });
      return false;
    }
    // `update()` actualiza solo los campos presentes en body y refresca `updatedAt`
    // automáticamente. La contraseña NO se toca aquí: usa updatePassword.
    await usuario.update(body);
    logger.info(CONTEXT, "Usuario actualizado", { id: body.id });
    return true;
  } catch (error) {
    logger.error(CONTEXT, "Error al actualizar usuario", { id: body.id, body, error });
    throw error;
  }
}

// Solo actualiza la contraseña, hasheándola con el mismo esquema (PBKDF2,
// formato `salt$derived`) que usan el login y createUsuario.
export async function updatePassword(id: number, password: string): Promise<boolean> {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      logger.warn(CONTEXT, "Intento de actualizar contraseña de usuario inexistente", { id });
      return false;
    }
    await usuario.update({ password: hashPassword(password) });
    logger.info(CONTEXT, "Contraseña actualizada", { id });
    return true;
  } catch (error) {
    logger.error(CONTEXT, "Error al actualizar contraseña", { id, error });
    throw error;
  }
}

export async function deleteUsuario(id: string): Promise<boolean> {
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      logger.warn(CONTEXT, "Intento de eliminar usuario inexistente", { id });
      return false;
    }
    await usuario.destroy();
    logger.info(CONTEXT, "Usuario eliminado", { id });
    return true;
  } catch (error) {
    logger.error(CONTEXT, "Error al eliminar usuario", { id, error });
    throw error;
  }
}
