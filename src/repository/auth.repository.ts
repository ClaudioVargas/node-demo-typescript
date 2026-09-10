import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Usuario } from "../models/usuario.model";
import { addTokenToBlacklist } from "../validators/tokenBlacklist";
import { logger } from "../utils/logger";

const SECRET = process.env.JWT_SECRET || "secretKey";
const CONTEXT = "AuthRepository";

function hashPassword(password: string) {
  try {
    const salt = crypto.randomBytes(16).toString("hex");
    return `${salt}$${crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")}`;
  } catch (error) {
    logger.error(CONTEXT, "Error al generar hash de contraseña", error);
    throw error;
  }
}
function verifyPassword(stored: string, attempted: string) {
  try {
    const [salt, derived] = stored.split("$");
    if (!salt || !derived) return false;
    const attemptedDerived = crypto.pbkdf2Sync(attempted, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(new Uint8Array(Buffer.from(derived, "hex")), new Uint8Array(Buffer.from(attemptedDerived, "hex")) );
  } catch (error) {
    logger.error(CONTEXT, "Error al verificar contraseña", error);
    return false;
  }
}
export async function signup(name: string, email: string, password: string) {
  try {
    if (await Usuario.findOne({ where: { email } })) {
      logger.warn(CONTEXT, "Intento de registro con email ya existente", { email });
      return null;
    }
    const usuario = await Usuario.create({ name, email, password: hashPassword(password), isActive: true } as any);
    logger.info(CONTEXT, "Usuario registrado", { id: usuario.id, name, email });
    return usuario;
  } catch (error) {
    logger.error(CONTEXT, "Error al registrar usuario", { email, error });
    throw error;
  }
}
export async function login(email: string, password: string) {
  try {
    const user = await Usuario.findOne({ where: { email } });
    if (!user || !verifyPassword((user as any).password, password)) {
      logger.warn(CONTEXT, "Login fallido (credenciales inválidas o usuario inexistente)", { email });
      return null;
    }
    logger.info(CONTEXT, "Login exitoso", { id: user.id, email });
    return jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: "1h" });
  } catch (error) {
    logger.error(CONTEXT, "Error en login", { email, error });
    throw error;
  }
}
export function logout(token: string) {
  try {
    const decoded: any = jwt.decode(token);
    const expSeconds = decoded && decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
    addTokenToBlacklist(token, expSeconds);
    logger.info(CONTEXT, "Token invalidado (logout)", { expSeconds });
  } catch (error) {
    logger.error(CONTEXT, "Error en logout", error);
    throw error;
  }
}
export { hashPassword };
