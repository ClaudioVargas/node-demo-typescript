import { Role } from "../models/role.model";

export const findRoles = () => Role.findAll();
export async function createRole(body: any) {
  await Role.sync();
  body.createdAt = new Date();
  body.updatedAt = new Date();
  return Role.create(body);
}
