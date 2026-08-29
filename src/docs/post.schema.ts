/**
 * @openapi
 * tags:
 *   name: Posts
 *   description: Gestión de publicaciones
 */

/**
 * @openapi
 * /api/post:
 *   get:
 *     summary: Obtener todas las publicaciones
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Lista de publicaciones
 */

/**
 * @openapi
 * /api/post/{id}:
 *   get:
 *     summary: Obtener una publicación por ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la publicación
 *     responses:
 *       200:
 *         description: Publicación encontrada
 *       404:
 *         description: Publicación no encontrada
 */

/**
 * @openapi
 * /api/post/posts/{id}:
 *   get:
 *     summary: Obtener publicaciones de un usuario por ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de publicaciones del usuario
 *       404:
 *         description: Usuario no encontrado o sin publicaciones
 */

/**
 * @openapi
 * /api/post:
 *   post:
 *     summary: Crear una nueva publicación
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               contenido:
 *                 type: string
 *               usuarioId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Publicación creada exitosamente
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /api/post/{id}:
 *   delete:
 *     summary: Eliminar una publicación por ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la publicación
 *     responses:
 *       200:
 *         description: Publicación eliminada
 *       404:
 *         description: Publicación no encontrada
 */
