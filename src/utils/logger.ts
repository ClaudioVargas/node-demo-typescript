import fs from "fs";
import path from "path";

/**
 * Logger ligero sin dependencias externas.
 *
 * Escribe a consola y a un archivo (logs/app.log) líneas estructuradas con:
 *   [timestamp] [nivel] [contexto] mensaje | meta
 *
 * Uso:
 *   logger.info("TemaRepository", "Tema creado", { id: 1, name: "Node" });
 *   logger.error("TemaRepository", "Error al crear tema", error);
 */
type LogLevel = "INFO" | "WARN" | "ERROR";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

// Asegurar que el directorio de logs exista (solo falla en entornos sin permisos,
// en cuyo caso se degrada a consola).
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch {
  /* sin acceso al filesystem: se loguea solo a consola */
}

/** Serializa metadata incluyendo errores (con stack) y objetos sin romper por ciclos. */
function serialize(value: any): string {
  if (value instanceof Error) return `${value.message}\n${value.stack || ""}`;
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function write(level: LogLevel, context: string, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] [${context}] ${message}${meta !== undefined ? ` | ${serialize(meta)}` : ""}`;

  if (level === "ERROR") console.error(line);
  else if (level === "WARN") console.warn(line);
  else console.log(line);

  try {
    fs.appendFileSync(LOG_FILE, line + "\n", { encoding: "utf8", flag: "a" });
  } catch {
    /* si no se puede escribir al archivo, el log de consola ya fue emitido */
  }
}

export const logger = {
  info: (context: string, message: string, meta?: any) => write("INFO", context, message, meta),
  warn: (context: string, message: string, meta?: any) => write("WARN", context, message, meta),
  error: (context: string, message: string, meta?: any) => write("ERROR", context, message, meta),
};