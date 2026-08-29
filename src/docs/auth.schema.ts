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
 * /api/auth/hashPassword:
 *   get:
 *     tags:
 *       - Utils
 *     summary: Generar un hash de prueba
 *     description: >
 *       Este endpoint ejecuta la función `hashPasswordTest` y devuelve un string con un hash
 *       generado de forma interna. No recibe parámetros en la petición.
 *     responses:
 *       '200':
 *         description: Hash generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"
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
