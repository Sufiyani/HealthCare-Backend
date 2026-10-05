import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  addVital,
  getAllVitals,
  getVital,
  deleteVital,
  getHealthTips
} from '../controllers/vitalController.js';

const router = express.Router();

router.post('/', protect, addVital);
router.get('/', protect, getAllVitals);
router.get('/health-tips', protect, getHealthTips);
router.get('/:id', protect, getVital);
router.delete('/:id', protect, deleteVital);

export default router;
