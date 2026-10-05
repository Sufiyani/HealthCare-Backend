import Vital from '../models/Vital.js';
import GeminiService from '../services/geminiService.js';
import ApiResponse from '../utils/responses.js';

export const addVital = async (req, res, next) => {
  try {
    const { date, bloodPressure, bloodSugar, weight, temperature, heartRate, notes } = req.body;

    if (!date) {
      return ApiResponse.badRequest(res, 'Date is required');
    }

    const vital = await Vital.create({
      user: req.user._id,
      date,
      bloodPressure,
      bloodSugar,
      weight,
      temperature,
      heartRate,
      notes
    });

    // Generate health tips asynchronously
    GeminiService.getHealthTips(vital)
      .then(result => {
        if (result.success) {
          console.log('✅ Health tips generated');
        }
      })
      .catch(err => console.error('❌ Health tips error:', err));

    ApiResponse.created(res, { vital }, 'Vital saved successfully');
  } catch (error) {
    next(error);
  }
};

export const getAllVitals = async (req, res, next) => {
  try {
    const vitals = await Vital.find({ user: req.user._id }).sort({ date: -1 });

    ApiResponse.success(res, {
      count: vitals.length,
      vitals
    });
  } catch (error) {
    next(error);
  }
};

export const getVital = async (req, res, next) => {
  try {
    const vital = await Vital.findById(req.params.id);

    if (!vital) return ApiResponse.notFound(res, 'Vital not found');

    if (vital.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    ApiResponse.success(res, { vital });
  } catch (error) {
    next(error);
  }
};

export const deleteVital = async (req, res, next) => {
  try {
    const vital = await Vital.findById(req.params.id);

    if (!vital) return ApiResponse.notFound(res, 'Vital not found');

    if (vital.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res);
    }

    await vital.deleteOne();

    ApiResponse.success(res, null, 'Vital deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getHealthTips = async (req, res, next) => {
  try {
    const latestVital = await Vital.findOne({ user: req.user._id }).sort({ date: -1 });

    if (!latestVital) {
      return ApiResponse.notFound(res, 'No vitals found');
    }

    const result = await GeminiService.getHealthTips(latestVital);

    if (!result.success) {
      return ApiResponse.error(res, 'Failed to generate health tips');
    }

    ApiResponse.success(res, result.tips);
  } catch (error) {
    next(error);
  }
};
