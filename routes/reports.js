import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../config/multer.js';
import {
  uploadReport,
  getAllReports,
  getReport,
  deleteReport
} from '../controllers/reportController.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadReport);
router.get('/', protect, getAllReports);
router.get('/:id', protect, getReport);
router.delete('/:id', protect, deleteReport);

export default router;
