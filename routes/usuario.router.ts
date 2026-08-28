import { Router } from "express";
import { deleteUsuario, getUsuario, getUsuarios, postLikeTema, postUsuario, putUsuario } from "../controllers/usuarios.controller";
import ValidateCreate from "../validators/user.validator";

const router = Router()

/**
 * @openapi
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Juan"
 *         email:
 *           type: string
 *           example: "juan@example.com"
 *         temas:
 *           type: array
 *           items:
 *             type: string
 *           example: ["node", "typescript"]
 */

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtener lista de usuarios
 *     responses:
 *       '200':
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 */
router.get('/', getUsuarios)

/**
 * @openapi
 * /api/usuarios/{id}:
 *   get:
 *     tags:
 *       - Usuarios
 *     summary: Obtener un usuario por ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       '404':
 *         description: Usuario no encontrado
 */
router.get('/:id', getUsuario)

/**
 * @openapi
 * /api/usuarios:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Crear un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       '400':
 *         description: Error en validación
 */
router.post('/', ValidateCreate, postUsuario)

/**
 * @openapi
 * /api/usuarios/addTema:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Agregar un tema liked a un usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarioId:
 *                 type: integer
 *               tema:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Tema agregado
 */
router.post('/addTema', postLikeTema)

/**
 * @openapi
 * /api/usuarios:
 *   put:
 *     tags:
 *       - Usuarios
 *     summary: Actualizar un usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUsuarioSchema'
 *     responses:
 *       '200':
 *         description: Usuario actualizado correctamente
 *       '409':
 *         description: El usuario con el ID proporcionado no existe
 *       '500':
 *         description: Error interno del servidor
 */
router.put('/', ValidateCreate, putUsuario)

/**
 * @openapi
 * /api/usuarios/{id}:
 *   delete:
 *     tags:
 *       - Usuarios
 *     summary: Eliminar un usuario por ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '204':
 *         description: Usuario eliminado
 */
router.delete('/:id', deleteUsuario)


export default router;