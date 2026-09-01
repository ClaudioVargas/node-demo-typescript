import { Request, Response } from "express";
import { findTemas, findTema, createTema, updateTema } from "../repository/tema.repository";
export const getTemas = async (_req: Request, res: Response) => res.status(200).json(await findTemas());
export const getTema = async (req: Request, res: Response) => {
  const { id } = req.params; const tema = await findTema(id);
  if (!tema) return res.status(404).json({ msg: "Tema con id " + id + " no encontrado" });
  return res.json(tema);
};
export const postTema = async (req: Request, res: Response) => {
  try {
    const response = await createTema(req.body);
    if (!response) return res.status(409).json({ msg: "Email " + req.body.email + " ya existe" });
    return res.json({ msg: response });
  } catch (error) { return res.status(500).json({ msg: "Contecte con el administrador" }); }
};
export const putTema = async (req: Request, res: Response) => {
  try {
    if (await updateTema(req.body)) return res.json({ src: "usuario editado correctamente" });
    return res.status(409).json({ msg: "Tema con id " + req.body.id + "no exisete" });
  } catch (error) { return res.status(500).json({ msg: "Contecte con el administrador", error }); }
};
export const deleteTema = (req: Request, res: Response) => res.json({ msg: "deleteTema", id: req.params.id });
