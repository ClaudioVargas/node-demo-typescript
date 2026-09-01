import { hashPassword } from "./auth.repository";
import { Usuario } from "../models/usuario.model";
import { UsuarioTema } from "../models/usuarioTemas.model";
import { Tema } from "../models/tema.model";

export const findUsuarios = () => Usuario.findAll();
export const findUsuario = (id: string) => Usuario.findByPk(id);

export async function createUsuario(body: any) {
  await Usuario.sync({ alter: true });
  if (await Usuario.findOne({ where: { email: body.email } })) return null;
  // Mismo esquema de hashing (PBKDF2, formato `salt$derived`) que usa el login
  // en auth.repository.ts; así las contraseñas de usuarios creados aquí son
  // verificables al iniciar sesión.
  const hashedPassword = hashPassword(body.password);
  return Usuario.create({ ...body, password: hashedPassword, createdAt: new Date(), updatedAt: new Date() } as any);
}

export async function likeTema(body: any) {
  await UsuarioTema.sync({ alter: true });
  const usuarioTema = new UsuarioTema(body);
  if (!await Tema.findOne({ where: { id: usuarioTema.usuarioId } })) return { error: "usuario" };
  if (!await Tema.findOne({ where: { id: usuarioTema.temaId } })) return { error: "tema" };
  if (await UsuarioTema.findOne({ where: { usuarioId: usuarioTema.usuarioId, temaId: usuarioTema.temaId } })) return { error: "exists" };
  body.createdAt = new Date();
  body.updatedAt = new Date();
  return { response: await UsuarioTema.create(body) };
}

export async function updateUsuario(body: any) {
  const usuario = await Usuario.findByPk(body.id);
  if (!usuario) return false;
  // Si el update incluye password, hashearla con el mismo esquema del login
  // para no guardar una contraseña en texto plano ni en formato incompatible.
  if (body.password) body.password = hashPassword(body.password);
  body.updatedAt = new Date();
  usuario.set(body);
  await usuario.save();
  return true;
}
