import { Router, Request, Response } from 'express'
import { Readable } from 'stream'

const router = Router()

// /api/utils/stream - example streaming response
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  const readable = Readable.from(['Hola ', 'desde ', 'streams', '!'])
  readable.pipe(res)
})

// /api/utils/buffer - example handling buffer data
router.post('/buffer', async (req: Request, res: Response) => {
  // Accept raw buffer or JSON body; demonstrate Buffer usage
  let buf: Buffer
  if (req.body && Object.keys(req.body).length) {
    const json = JSON.stringify(req.body)
    buf = Buffer.from(json, 'utf8')
  } else {
    // fallback: small example buffer
    buf = Buffer.from('default-buffer', 'utf8')
  }

  // example: slice first 10 bytes and return length
  const slice = buf.slice(0, 10)
  res.json({ originalLength: buf.length, slice: slice.toString('utf8') })
})

export default router
