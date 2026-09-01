import { Request, Response, NextFunction } from "express";
import { signup as createAccount, login as authenticate, logout as invalidateToken, hashPassword } from "../repository/auth.repository";
import { ApiError } from "../validators/apiError";

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return next(new ApiError(400, "name, email and password required"));
    const user = await createAccount(name, email, password);
    if (!user) return next(new ApiError(409, "Email already registered"));
    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) { next(err); }
}
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return next(new ApiError(400, "email and password required"));
    const token = await authenticate(email, password);
    if (!token) return next(new ApiError(401, "Invalid credentials"));
    return res.json({ token });
  } catch (err) { next(err); }
}
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return next(new ApiError(400, "No token provided"));
    invalidateToken(auth.split(" ")[1]);
    return res.json({ ok: true });
  } catch (err) { next(err); }
}
export async function hashPasswordTest(req: Request, res: Response, next: NextFunction) {
  try {
    const { password } = req.params;
    if (!password) return next(new ApiError(400, "password required"));
    const hash = await hashPassword(password);
    return res.json({ ok: true, hash}); 
  }
  catch (err) { next(err); }
}
