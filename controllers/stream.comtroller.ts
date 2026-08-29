import { NextFunction, Request, Response } from "express"
import { Readable } from 'stream'

export const getStream = async (req: Request, res: Response) => {
     res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      const readable = Readable.from(['Hola ', 'desde ', 'streams', '!'])
      readable.pipe(res)  
}

export const postBuffer = async (req: Request, res: Response) => {
  let buf: Buffer
  if (req.body && Object.keys(req.body).length) {
    const json = JSON.stringify(req.body)
    buf = Buffer.from(json, 'utf8')
  } else {
    buf = Buffer.from('default-buffer', 'utf8')
  }

  const slice = buf.subarray(0, 10)
  res.json({ originalLength: buf.length, slice: slice.toString('utf8') })
}

export const nasaStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nasaUrl = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
    const response = await fetch(nasaUrl);

    // Manejar códigos de error HTTP desde la API externa
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return res.status(502).json({ error: `La API de la NASA respondió con status ${response.status}`, details: text })
    }

    // Intentar leer el content-type para decidir si hacer streaming binario o devolver JSON
    const contentType = response.headers.get('content-type') || ''

    // Si la API devuelve JSON (APOD normalmente devuelve JSON), devolverlo directamente para que Swagger/OpenAPI funcione correctamente
    if (contentType.includes('application/json')) {
      const json = await response.json()
      return res.json(json)
    }

    // Si es imagen o binario y la body es un ReadableStream, hacer streaming
    if (contentType.startsWith('image/') || (response.body && typeof (response.body as any).getReader === 'function')) {
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'no-cache')

      if (response.body && typeof (response.body as any).getReader === 'function') {
        const reader = (response.body as any).getReader()
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            if (value) res.write(Buffer.from(value))
          }
          res.end()
          return
        } catch (err) {
          // Problema leyendo el stream
          console.error('Error leyendo stream desde NASA:', err)
          return res.status(500).json({ message: 'Error en el proxy de streaming' })
        }
      }

      // Si no es un WHATWG ReadableStream, intentar usar response.arrayBuffer como fallback
      try {
        const ab = await response.arrayBuffer()
        res.end(Buffer.from(ab))
        return
      } catch (err) {
        console.error('Error en fallback de lectura binaria:', err)
        return res.status(500).json({ message: 'Error en el proxy de streaming' })
      }
    }

    // Por defecto, intentar parsear como JSON y devolver
    const fallback = await response.text().catch(() => '')
    if (fallback) {
      // intentar parsear JSON seguro
      try {
        const parsed = JSON.parse(fallback)
        return res.json(parsed)
      } catch (_) {
        return res.type('text').send(fallback)
      }
    }

    // Si no hay nada utilizable
    return res.status(502).json({ error: 'La API de la NASA no respondió con un cuerpo de datos válido.' })

  } catch (error) {
    console.error('Error en nasa-stream-v2:', error)
    return res.status(500).json({ message: 'Error en el proxy de streaming' })
  }

  
}

export const imageBuffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // API pública de Picsum Photos
    const url = "https://picsum.photos/200/300";
    const response = await fetch(url);

    if (!response.body) {
      res.status(502).json({ error: "La API de Picsum no devolvió datos válidos." });
      return;
    }

    // Convertimos el stream en Buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ejemplo: devolver información del buffer
    res.json({
      length: buffer.length,
      slice: buffer.slice(0, 20).toString("hex"), // primeros 20 bytes en hex
    });
  } catch (error) {
    next(error);
  }
}