import { Tema } from "../models/tema.model";

export const findTemas = () => Tema.findAll();
export const findTema = (id: string) => Tema.findByPk(id);
export async function createTema(body: any) {
  await Tema.sync();
  const tema = new Tema(body);
  if (await Tema.findOne({ where: { name: tema.name } })) return null;
  body.createdAt = new Date();
  body.updatedAt = new Date();
  return Tema.create(body);
}
export async function updateTema(body: any) {
  const tema = await Tema.findByPk(body.id);
  if (!tema) return false;
  body.updatedAt = new Date();
  tema.set(body);
  await tema.save();
  return true;
}
