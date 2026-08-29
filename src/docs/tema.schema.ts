/**
 * @openapi
 * tags:
 *   name: Temas
 *   description: Gestión de temas
 */

/**
 * @openapi
 * /api/tema:
 *   get:
 *     summary: Obtener todos los temas
 *     tags: [Temas]
 *     responses:
 *       200:
 *         description: Lista de temas
 */

/**
 * @openapi
 * /api/tema/{id}:
 *   get:
 *     summary: Obtener un tema por ID
 *     tags: [Temas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tema
 *     responses:
 *       200:
 *         description: Tema encontrado
 *       404:
 *         description: Tema no encontrado
 */

/**
 * @openapi
 * /api/tema:
 *   post:
 *     summary: Crear un nuevo tema
 *     tags: [Temas]
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
 *         description: Tema creado exitosamente
 *       400:
 *         description: Datos inválidos
 */

/**
 * @openapi
 * /api/tema/{id}:
 *   delete:
 *     summary: Eliminar un tema por ID
 *     tags: [Temas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tema
 *     responses:
 *       200:
 *         description: Tema eliminado
 *       404:
 *         description: Tema no encontrado
 */
