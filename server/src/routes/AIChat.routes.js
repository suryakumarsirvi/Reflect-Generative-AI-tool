import express from 'express';
import { AIresponse, getChatMessages, getChats, uploadDocument } from '../controllers/aiChat.controller.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', getChats);
router.get('/:chatId/messages', getChatMessages);
router.post('/', AIresponse);
router.post('/upload', upload.single('file'), uploadDocument);

export default router;