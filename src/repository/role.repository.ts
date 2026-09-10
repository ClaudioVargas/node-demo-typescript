import { Role } from "../models/role.model";
import { logger } from "../utils/logger";

const CONTEXT = "RoleRepository";

export async function findRoles() {
  try {
    const roles = await Role.findAll();
    logger.info(CONTEXT, `Listado de roles: ${roles.length} encontrados`);
    return roles;
  } catch (error) {
    logger.error(CONTEXT, "Error al listar roles", error);
    throw error;
  }
}

export async function createRole(body: any) {
  try {
    await Role.sync();
    body.createdAt = new Date();
    body.updatedAt = new Date();
    const role = await Role.create(body);
    logger.info(CONTEXT, "Rol creado", { id: role.id });
    return role;
  } catch (error) {
    logger.error(CONTEXT, "Error al crear rol", { body, error });
    throw error;
  }
}

// 🔹 Función para actualizar un rol por ID
export async function updateRole(id: string, body: any) {
  try {
    // Buscar el rol por ID
    const role = await Role.findByPk(id);

    if (!role) {
      logger.warn(CONTEXT, "Intento de actualizar rol inexistente", { id });
      throw new Error(`Rol con ID ${id} no encontrado`);
    }

    // Actualizar campos
    body.updatedAt = new Date();

    // Actualizar solo los campos que vienen en body
    await role.update(body);
    logger.info(CONTEXT, "Rol actualizado", { id });
    return role;
  } catch (error) {
    logger.error(CONTEXT, "Error al actualizar rol", { id, body, error });
    throw error;
  }
}
