import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  askQuestion,
  getConversation,
  clearConversation
} from '../controllers/assistantController.js';

const router = express.Router();

router.post('/ask', protect, askQuestion);
router.get('/conversation/:reportId', protect, getConversation);
router.delete('/conversation/:reportId', protect, clearConversation);

export default router;