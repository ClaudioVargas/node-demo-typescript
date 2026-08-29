/**
 * @openapi
 * tags:
 *   name: Role
 *   description: Gestión de roles
 */

/**
 * @openapi
 * /api/role:
 *   get:
 *     summary: Obtener todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles
 */

/**
 * @openapi
 * /api/role:
 *   post:
 *     summary: Crear un nuevo role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role creada exitosamente
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /api/role/{id}:
 *   delete:
 *     summary: Eliminar un role por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del role
 *     responses:
 *       200:
 *         description: Publicación eliminada
 *       404:
 *         description: Publicación no encontrada
 */
