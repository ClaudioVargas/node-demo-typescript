import { Readable } from "stream";
import { logger } from "../utils/logger";

const CONTEXT = "StreamRepository";

export function createStream() {
  try {
    return Readable.from(["Hola ", "desde ", "streams", "!"]);
  } catch (error) {
    logger.error(CONTEXT, "Error al crear stream", error);
    throw error;
  }
}
export function createBuffer(body: any) {
  try {
    const buf = body && Object.keys(body).length ? Buffer.from(JSON.stringify(body), "utf8") : Buffer.from("default-buffer", "utf8");
    logger.info(CONTEXT, "Buffer creado", { originalLength: buf.length });
    return { originalLength: buf.length, slice: buf.subarray(0, 10).toString("utf8") };
  } catch (error) {
    logger.error(CONTEXT, "Error al crear buffer", { body, error });
    throw error;
  }
}
export async function nasaStream() {
  try {
    const response = await fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY");
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      logger.warn(CONTEXT, "La API de la NASA respondió con error", { status: response.status });
      return { type: "error" as const, status: 502, value: { error: `La API de la NASA respondió con status ${response.status}`, details } };
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const value = await response.json();
      logger.info(CONTEXT, "Respuesta JSON de la NASA obtenida");
      return { type: "json" as const, value };
    }
    if (contentType.startsWith("image/") || (response.body && typeof (response.body as any).getReader === "function")) {
      if (response.body && typeof (response.body as any).getReader === "function") {
        const reader = (response.body as any).getReader(); const chunks: Buffer[] = [];
        try { while (true) { const { value, done } = await reader.read(); if (done) break; if (value) chunks.push(Buffer.from(value)); } logger.info(CONTEXT, "Stream binario de la NASA leído", { chunks: chunks.length }); return { type: "binary" as const, contentType, value: Buffer.concat(chunks) }; }
        catch (error) { logger.error(CONTEXT, "Error leyendo stream desde NASA", error); return { type: "error" as const, status: 500, value: { message: "Error en el proxy de streaming" } }; }
      }
      try { const value = Buffer.from(await response.arrayBuffer()); logger.info(CONTEXT, "Imagen de la NASA leída vía arrayBuffer"); return { type: "binary" as const, contentType, value }; }
      catch (error) { logger.error(CONTEXT, "Error en fallback de lectura binaria", error); return { type: "error" as const, status: 500, value: { message: "Error en el proxy de streaming" } }; }
    }
    const fallback = await response.text().catch(() => "");
    if (fallback) { try { return { type: "json" as const, value: JSON.parse(fallback) }; } catch (_) { return { type: "text" as const, value: fallback }; } }
    logger.warn(CONTEXT, "La API de la NASA no respondió con un cuerpo de datos válido");
    return { type: "error" as const, status: 502, value: { error: "La API de la NASA no respondió con un cuerpo de datos válido." } };
  } catch (error) {
    logger.error(CONTEXT, "Error al consultar la API de la NASA", error);
    return { type: "error" as const, status: 502, value: { error: "Error al consultar la API de la NASA", details: String(error) } };
  }
}
export async function imageBuffer() {
  try {
    const response = await fetch("https://picsum.photos/200/300");
    if (!response.body) {
      logger.warn(CONTEXT, "Picsum no devolvió cuerpo en la respuesta");
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    logger.info(CONTEXT, "Imagen de Picsum obtenida", { length: buffer.length });
    return { length: buffer.length, slice: buffer.slice(0, 20).toString("hex") };
  } catch (error) {
    logger.error(CONTEXT, "Error al obtener imagen de Picsum", error);
    return null;
  }
}
