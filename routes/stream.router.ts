import { Router, Request, Response, NextFunction } from 'express'
import { getStream, imageBuffer, nasaStream, postBuffer } from '../controllers/stream.comtroller';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Utils
 *   description: Endpoints de utilidades y ejemplos
 */

/**
 * @openapi
 * /api/utils/stream:
 *   get:
 *     summary: Ejemplo de respuesta en streaming
 *     tags: [Utils]
 *     responses:
 *       200:
 *         description: Devuelve texto en streaming
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             example: "Hola desde streams!"
 */
router.get('/stream', getStream)

/**
 * @openapi
 * /api/utils/buffer:
 *   post:
 *     summary: Ejemplo de manejo de Buffer
 *     tags: [Utils]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *           example:
 *             mensaje: "hola"
 *     responses:
 *       200:
 *         description: Devuelve información del buffer procesado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 originalLength:
 *                   type: integer
 *                 slice:
 *                   type: string
 *             example:
 *               originalLength: 20
 *               slice: "hola"
 */
router.post('/buffer', postBuffer)

/**
 * @openapi
 * /api/utils/nasa-stream:
 *   get:
 *     tags:
 *       - Utils
 *     summary: Stream de datos de la NASA (Astronomy Picture of the Day)
 *     description: >
 *       Este endpoint conecta con la API pública de la NASA (APOD) usando la API key de demostración
 *       y transmite en streaming el JSON de respuesta directamente al cliente.  
 *       La respuesta incluye metadatos de la imagen astronómica del día, como título, explicación y URL.
 *     responses:
 *       '200':
 *         description: Transmisión de datos iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   example: "2026-08-18"
 *                 title:
 *                   type: string
 *                   example: "Astronomy Picture of the Day"
 *                 explanation:
 *                   type: string
 *                   example: "Descripción astronómica del día..."
 *                 url:
 *                   type: string
 *                   format: uri
 *                   example: "https://apod.nasa.gov/apod/image/2608/ExampleGalaxy_1024.jpg"
 *                 hdurl:
 *                   type: string
 *                   format: uri
 *                   example: "https://apod.nasa.gov/apod/image/2608/ExampleGalaxy.jpg"
 *       '502':
 *         description: La API de la NASA no respondió con un cuerpo de datos válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "La API de la NASA no respondió con un cuerpo de datos válido."
 *       '500':
 *         description: Error interno al procesar el stream
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Error en el proxy de streaming"
 */
router.get('/nasa-stream', nasaStream);

/**
 * @openapi
 * /api/utils/image-buffer:
 *   get:
 *     tags:
 *       - Utils
 *     summary: Obtener un buffer desde una imagen pública
 *     description: >
 *       Este endpoint consume la API gratuita de Picsum Photos (`https://picsum.photos/200/300`)
 *       para obtener una imagen aleatoria y convertirla en un Buffer.  
 *       Devuelve información básica del buffer, como su longitud y un fragmento en formato hexadecimal.
 *     responses:
 *       '200':
 *         description: Buffer generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 length:
 *                   type: integer
 *                   example: 12345
 *                 slice:
 *                   type: string
 *                   description: Primeros bytes del buffer en formato hexadecimal
 *                   example: "ffd8ffe000104a464946"
 *       '502':
 *         description: La API de Picsum no devolvió datos válidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "La API de Picsum no devolvió datos válidos."
 *       '500':
 *         description: Error interno al procesar el buffer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Error en el proxy de buffer"
 */
router.get("/image-buffer", imageBuffer);

export default router
