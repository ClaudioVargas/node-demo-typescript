import { Request, Response } from "express";
import { findRoles, createRole } from "../repository/role.repository";
export const getRoles = async (_req: Request, res: Response) => res.status(200).json({ data: await findRoles() });
export const postRole = async (req: Request, res: Response) => {
  try { return res.status(201).json({ msg: await createRole(req.body) }); }
  catch (error) { return res.status(500).json({ msg: "Contecte con el administrador" }); }
};
export const deleteRole = (req: Request, res: Response) => res.json({ msg: "deleteRole", id: req.params.id });
