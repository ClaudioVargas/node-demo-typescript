import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Usuario } from "../models/usuario.model";
import { addTokenToBlacklist } from "../validators/tokenBlacklist";

const SECRET = process.env.JWT_SECRET || "secretKey";
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}$${crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")}`;
}
function verifyPassword(stored: string, attempted: string) {
  const [salt, derived] = stored.split("$");
  if (!salt || !derived) return false;
  const attemptedDerived = crypto.pbkdf2Sync(attempted, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(new Uint8Array(Buffer.from(derived, "hex")), new Uint8Array(Buffer.from(attemptedDerived, "hex")) );
}
export async function signup(name: string, email: string, password: string) {
  if (await Usuario.findOne({ where: { email } })) return null;
  return Usuario.create({ name, email, password: hashPassword(password), isActive: true } as any);
}
export async function login(email: string, password: string) {
  const user = await Usuario.findOne({ where: { email } });
  if (!user || !verifyPassword((user as any).password, password)) return null;
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: "1h" });
}
export function logout(token: string) {
  const decoded: any = jwt.decode(token);
  const expSeconds = decoded && decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
  addTokenToBlacklist(token, expSeconds);
}
export { hashPassword };
