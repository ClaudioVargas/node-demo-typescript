import { NextFunction, Request, Response } from "express";
import { createStream, createBuffer, nasaStream as fetchNasa, imageBuffer as fetchImage } from "../repository/stream.repository";

export const getStream = async (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  createStream().pipe(res);
};
export const postBuffer = async (req: Request, res: Response) => res.json(createBuffer(req.body));
export const nasaStream = async (_req: Request, res: Response) => {
  try {
    const result = await fetchNasa();
    if (result.type === "error") return res.status(result.status).json(result.value);
    if (result.type === "json") return res.json(result.value);
    if (result.type === "binary") {
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Cache-Control", "no-cache");
      return res.end(result.value);
    }
    if (result.type === "text") return res.type("text").send(result.value);
  } catch (error) { console.error("Error en nasa-stream-v2:", error); return res.status(500).json({ message: "Error en el proxy de streaming" }); }
};
export const imageBuffer = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await fetchImage();
    if (!result) return res.status(502).json({ error: "La API de Picsum no devolvió datos válidos." });
    return res.json(result);
  } catch (error) { next(error); }
};
