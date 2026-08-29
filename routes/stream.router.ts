import { Router } from 'express'
import { getStream, imageBuffer, nasaStream, postBuffer } from '../controllers/stream.comtroller';

const router = Router();

router.get('/stream', getStream)
router.post('/buffer', postBuffer)
router.get('/nasa-stream', nasaStream);
router.get("/image-buffer", imageBuffer);

export default router
