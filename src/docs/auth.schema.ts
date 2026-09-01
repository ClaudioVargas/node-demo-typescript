/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Autenticación y seguridad
 */

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Crear una cuenta de usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Usuario creado
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login y obtener JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Devuelve token JWT
 */

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout (revoca token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Token revocado
 */

/**
 * @openapi
 * /api/auth/hashPassword/{password}:
 *   get:
 *     tags:
 *       - Utils
 *     summary: Generar un hash de prueba
 *     description: >
 *       Este endpoint ejecuta la función `hashPasswordTest` y devuelve un string con un hash
 *       generado a partir del parámetro `password` recibido en la URL.
 *     parameters:
 *       - name: password
 *         in: path
 *         required: true
 *         description: Cadena de texto que se desea hashear
 *         schema:
 *           type: string
 *           example: "MiClave123"
 *     responses:
 *       '200':
 *         description: Hash generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 hash:
 *                   type: string
 *                   example: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Y3Fz6lYz8QZcQ9lFh1ZyW"
 *       '400':
 *         description: Parámetro faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 msg:
 *                   type: string
 *                   example: "Debe enviar un parámetro 'password'"
 *       '500':
 *         description: Error interno al generar el hash
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error al generar hash"
 */

