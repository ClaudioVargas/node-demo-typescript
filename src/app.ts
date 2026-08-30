// Cargar variables de entorno ANTES de importar cualquier módulo que las lea.
// `dotenv/config` debe ser el primer import: en CommonJS/ESM tsc respeta el
// orden de imports y así el resto de módulos ya encuentran PORT, DB_*, JWT_SECRET, etc.
import 'dotenv/config'

import { start } from './concurrency'

start().catch((error) => {
  console.error('[app] Error fatal durante el arranque:', error)
  process.exit(1)
})