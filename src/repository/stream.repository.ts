import { Readable } from "stream";

export const createStream = () => Readable.from(["Hola ", "desde ", "streams", "!"]);
export function createBuffer(body: any) {
  const buf = body && Object.keys(body).length ? Buffer.from(JSON.stringify(body), "utf8") : Buffer.from("default-buffer", "utf8");
  return { originalLength: buf.length, slice: buf.subarray(0, 10).toString("utf8") };
}
export async function nasaStream() {
  const response = await fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY");
  if (!response.ok) return { type: "error" as const, status: 502, value: { error: `La API de la NASA respondió con status ${response.status}`, details: await response.text().catch(() => "") } };
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return { type: "json" as const, value: await response.json() };
  if (contentType.startsWith("image/") || (response.body && typeof (response.body as any).getReader === "function")) {
    if (response.body && typeof (response.body as any).getReader === "function") {
      const reader = (response.body as any).getReader(); const chunks: Buffer[] = [];
      try { while (true) { const { value, done } = await reader.read(); if (done) break; if (value) chunks.push(Buffer.from(value)); } return { type: "binary" as const, contentType, value: Buffer.concat(chunks) }; }
      catch (error) { console.error("Error leyendo stream desde NASA:", error); return { type: "error" as const, status: 500, value: { message: "Error en el proxy de streaming" } }; }
    }
    try { return { type: "binary" as const, contentType, value: Buffer.from(await response.arrayBuffer()) }; }
    catch (error) { console.error("Error en fallback de lectura binaria:", error); return { type: "error" as const, status: 500, value: { message: "Error en el proxy de streaming" } }; }
  }
  const fallback = await response.text().catch(() => "");
  if (fallback) { try { return { type: "json" as const, value: JSON.parse(fallback) }; } catch (_) { return { type: "text" as const, value: fallback }; } }
  return { type: "error" as const, status: 502, value: { error: "La API de la NASA no respondió con un cuerpo de datos válido." } };
}
export async function imageBuffer() {
  const response = await fetch("https://picsum.photos/200/300");
  if (!response.body) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  return { length: buffer.length, slice: buffer.slice(0, 20).toString("hex") };
}
