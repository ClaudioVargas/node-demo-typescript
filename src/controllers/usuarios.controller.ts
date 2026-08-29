import { Request, Response } from "express";
import { findUsuarios, findUsuario, createUsuario, likeTema, updateUsuario } from "../repository/usuario.repository";

export const getUsuarios = async (_req: Request, res: Response) => res.status(200).json({ data: await findUsuarios() });
export const getUsuario = async (req: Request, res: Response) => {
  const { id } = req.params; const usuario = await findUsuario(id);
  if (!usuario) return res.status(404).json({ msg: "Usuario con id " + id + " no encontrado" });
  return res.json({ data: usuario });
};
export const postUsuario = async (req: Request, res: Response) => {
  try {
    const response = await createUsuario(req.body);
    if (!response) return res.status(409).json({ msg: `Email ${req.body.email} ya existe` });
    return res.status(201).json({ msg: "Usuario creado correctamente", usuario: { id: response.id, name: response.name, email: response.email, isActive: response.isActive } });
  } catch (error) { console.error(error); return res.status(500).json({ msg: "Conecte con el administrador" }); }
};
export const postLikeTema = async (req: Request, res: Response) => {
  try {
    const result = await likeTema(req.body);
    if (result.error === "usuario") return res.status(409).json({ msg: "usuario con id " + req.body.usuarioId + " no existe" });
    if (result.error === "tema") return res.status(409).json({ msg: "tema con id " + req.body.temaId + " no existe" });
    if (result.error) return res.status(409).json({ msg: "usuarioTema con id: " + req.body.temaId + " ya existe" });
    return res.status(201).json({ msg: result.response });
  } catch (error) { return res.status(500).json({ msg: "Contecte con el administrador" }); }
};
export const putUsuario = async (req: Request, res: Response) => {
  try {
    if (await updateUsuario(req.body)) return res.json({ src: "usuario editado correctamente" });
    return res.status(409).json({ msg: "Usuario con id " + req.body.id + "no exisete" });
  } catch (error) { return res.status(500).json({ msg: "Contecte con el administrador", error }); }
};
export const deleteUsuario = (req: Request, res: Response) => res.json({ msg: "deleteUsuario", id: req.params.id });
