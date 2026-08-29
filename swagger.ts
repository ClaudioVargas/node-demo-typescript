// swagger.ts - genera la spec para Swagger (soporta TS en dev y JS en dist)
import path from 'path'
import fs from 'fs'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

// Construir rutas de archivos que contengan las anotaciones JSDoc/Swagger
const cwd = process.cwd()

// Incluir rutas comunes: routes/ en root, archivos .ts en root, y dist compilado
function norm(p: string) { return p.split(path.sep).join('/') }
const apis = [
  norm(path.join(cwd, 'src', 'docs', '**', '*.ts')),
  norm(path.join(cwd, 'src', 'docs', '**', '*.js')),
  norm(path.join(cwd, 'routes', '*.ts')),
  norm(path.join(cwd, 'routes', '*.js')),
  norm(path.join(cwd, '*.ts')),
  norm(path.join(cwd, '*.js')),
  norm(path.join(cwd, 'dist', '**', '*.js')),
]

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Prueba Técnica',
      version: '1.0.0',
      description: 'Documentación moderna generada con Swagger y TypeScript',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Servidor Local',
      },
    ],
  },
  apis,
}

const swaggerSpec = swaggerJSDoc(options)

// Log summary to help debugging
const specAny: any = swaggerSpec
console.log('Swagger spec summary: paths=%d, components=%d', Object.keys(specAny.paths || {}).length, Object.keys(specAny.components || {}).length)

export function setupSwagger(app: Express): void {
  // Añadir cabecera para evitar cache en la UI
  app.use('/docs', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store')
    next()
  })

  // Montar la UI en /docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  // Endpoint que devuelve el JSON de la spec sin cache (útil para debugging y clientes)
  app.get('/docs/json', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.json(swaggerSpec)
  })

  console.log('Docs disponibles en http://localhost:8000/docs')
}
