import Report from '../models/Report.js';
import cloudinary from '../config/cloudinary.js';
import GeminiService from '../services/geminiService.js';
import ApiResponse from '../utils/responses.js';
import streamifier from 'streamifier';

// Helper: Upload to Cloudinary with PUBLIC access for PDFs
const uploadToCloudinary = (buffer, folder, mimeType) => {
  return new Promise((resolve, reject) => {
    let resourceType = 'auto';
    if (mimeType === 'application/pdf') {
      resourceType = 'raw';
    } else if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folder,
        resource_type: resourceType,
        access_mode: 'public',
        type: 'upload',
        invalidate: true
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          reject(error);
        } else {
          console.log('Cloudinary Upload Success:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type
          });
          resolve(result);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const uploadReport = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'Please upload a file');
    }

    const { name, type, date } = req.body;

    if (!name || !type || !date) {
      return ApiResponse.badRequest(res, 'Please provide all required fields');
    }

    // console.log('📤 Uploading report to Cloudinary...');
    // console.log('📄 File details:', {
    //   name: req.file.originalname,
    //   mimeType: req.file.mimetype,
    //   size: req.file.size
    // });
    // In uploadReport function, after file validation
console.log('🔍 File Debug Info:', {
  originalName: req.file.originalname,
  mimeType: req.file.mimetype,
  size: req.file.size,
  bufferType: typeof req.file.buffer,
  isBuffer: Buffer.isBuffer(req.file.buffer),
  bufferLength: req.file.buffer?.length,
  firstBytes: req.file.buffer?.slice(0, 10).toString('hex')
});

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      `healthmate/reports/${req.user._id}`,
      req.file.mimetype
    );

    console.log('✅ File uploaded to Cloudinary');
    console.log('📎 File URL:', result.secure_url);

    // Create report with placeholder analysis
    const report = await Report.create({
      user: req.user._id,
      name,
      type,
      date,
      fileUrl: result.secure_url,
      cloudinaryId: result.public_id,
      // ✅ Add placeholder to indicate analysis is pending
      aiAnalysis: {
        summaryEnglish: 'Analysis in progress...',
        summaryUrdu: 'Analysis jari hai...',
        severity: 'low',
        urgency: 'routine',
        keyFindings: [],
        suggestions: []
      }
    });

    console.log('✅ Report saved to database:', report._id);

    // ✅ CRITICAL FIX: Store file buffer for background processing
    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const reportId = report._id.toString();

    // Send immediate response
    ApiResponse.created(res, { report }, 'Report uploaded successfully. AI analysis starting...');

    // ✅ IMPROVED: AI Analysis in background with proper error handling
    console.log('🤖 Starting AI analysis in background...');
    
    // Use setImmediate instead of setTimeout for better performance
    setImmediate(async () => {
      try {
        console.log('📊 Analyzing report:', reportId);
        
        const analysisResult = await GeminiService.analyzeReport(
          fileBuffer, 
          mimeType, 
          type, 
          name
        );
        
        console.log('📊 AI Analysis result:', {
          success: analysisResult.success,
          hasAnalysis: !!analysisResult.analysis,
          error: analysisResult.error
        });
        
        if (analysisResult.success && analysisResult.analysis) {
          // ✅ Validate that analysis has real data
          const hasValidSummary = 
            analysisResult.analysis.summaryEnglish &&
            analysisResult.analysis.summaryEnglish.trim().length > 20 &&
            analysisResult.analysis.summaryEnglish !== 'undefined...' &&
            analysisResult.analysis.summaryEnglish !== 'Analysis in progress...';

          if (hasValidSummary) {
            const reportToUpdate = await Report.findById(reportId);
            
            if (reportToUpdate) {
              reportToUpdate.aiAnalysis = analysisResult.analysis;
              await reportToUpdate.save();
              
              console.log('✅ AI Analysis saved successfully!');
              console.log('📝 Summary (English):', analysisResult.analysis.summaryEnglish.substring(0, 100));
              console.log('📝 Severity:', analysisResult.analysis.severity);
              console.log('📝 Urgency:', analysisResult.analysis.urgency);
            } else {
              console.error('❌ Report not found for analysis update:', reportId);
            }
          } else {
            console.error('❌ Analysis returned but summary is invalid:', {
              summary: analysisResult.analysis.summaryEnglish,
              length: analysisResult.analysis.summaryEnglish?.length
            });
            
            // ✅ Save error state so frontend knows to show retry option
            const reportToUpdate = await Report.findById(reportId);
            if (reportToUpdate) {
              reportToUpdate.aiAnalysis = {
                summaryEnglish: 'Analysis failed. Please try re-uploading your report.',
                summaryUrdu: 'Analysis fail ho gaya. Report dobara upload karein.',
                severity: 'low',
                urgency: 'routine',
                keyFindings: ['AI analysis encountered an error'],
                suggestions: ['Please try uploading the report again'],
                error: true
              };
              await reportToUpdate.save();
              console.log('⚠️ Saved error state to report');
            }
          }
        } else {
          console.error('❌ AI Analysis failed:', analysisResult.error);
          
          // ✅ Save error state
          const reportToUpdate = await Report.findById(reportId);
          if (reportToUpdate) {
            reportToUpdate.aiAnalysis = {
              summaryEnglish: `Analysis failed: ${analysisResult.error || 'Unknown error'}. Please try re-uploading.`,
              summaryUrdu: 'Analysis fail ho gaya. Dobara upload karein.',
              severity: 'low',
              urgency: 'routine',
              keyFindings: [],
              suggestions: [],
              error: true
            };
            await reportToUpdate.save();
            console.log('⚠️ Saved error analysis');
          }
        }
      } catch (err) {
        console.error('❌ Background AI Analysis Error:', err.message);
        console.error('Stack:', err.stack);
        
        // ✅ Try to save error state even if analysis crashes
        try {
          const reportToUpdate = await Report.findById(reportId);
          if (reportToUpdate) {
            reportToUpdate.aiAnalysis = {
              summaryEnglish: 'Analysis failed due to an error. Please try again.',
              summaryUrdu: 'Analysis mein error aya. Dobara try karein.',
              severity: 'low',
              urgency: 'routine',
              keyFindings: [],
              suggestions: [],
              error: true
            };
            await reportToUpdate.save();
            console.log('⚠️ Saved crash error state');
          }
        } catch (saveError) {
          console.error('❌ Failed to save error state:', saveError);
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload Error:', error);
    next(error);
  }
};

export const getAllReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user._id }).sort({ date: -1 });

    console.log('📋 Found', reports.length, 'reports for user');
    
    // Log AI analysis status for each report
    reports.forEach(report => {
      const hasValidAnalysis = 
        report.aiAnalysis && 
        report.aiAnalysis.summaryEnglish && 
        report.aiAnalysis.summaryEnglish.trim().length > 20 &&
        !report.aiAnalysis.summaryEnglish.includes('in progress');
      
      console.log(`  - ${report.name}: AI Analysis ${hasValidAnalysis ? '✅' : '⏳ pending'}`);
    });

    ApiResponse.success(res, {
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('❌ Get Reports Error:', error);
    next(error);
  }
};

export const getReport = async (req, res, next) => {
  try {
    console.log('🔍 Fetching report:', req.params.id);
    
    const report = await Report.findById(req.params.id);

    if (!report) {
      console.log('❌ Report not found:', req.params.id);
      return ApiResponse.notFound(res, 'Report not found');
    }

    if (report.user.toString() !== req.user._id.toString()) {
      console.log('❌ Unauthorized access attempt');
      return ApiResponse.forbidden(res, 'Not authorized to access this report');
    }

    console.log('✅ Report found:', report.name);
    
    const hasValidAnalysis = 
      report.aiAnalysis && 
      report.aiAnalysis.summaryEnglish && 
      report.aiAnalysis.summaryEnglish.trim().length > 20 &&
      !report.aiAnalysis.summaryEnglish.includes('in progress');
    
    console.log('📊 AI Analysis status:', hasValidAnalysis ? 'Complete ✅' : 'Pending ⏳');
    
    if (report.aiAnalysis) {
      console.log('📝 Analysis summary:', {
        summaryLength: report.aiAnalysis.summaryEnglish?.length,
        summaryPreview: report.aiAnalysis.summaryEnglish?.substring(0, 50) + '...',
        severity: report.aiAnalysis.severity,
        urgency: report.aiAnalysis.urgency,
        hasError: report.aiAnalysis.error
      });
    }

    ApiResponse.success(res, { report });
  } catch (error) {
    console.error('❌ Get Report Error:', error);
    next(error);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) return ApiResponse.notFound(res, 'Report not found');

    if (report.user.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Not authorized to delete this report');
    }

    // Delete from Cloudinary
    if (report.cloudinaryId) {
      try {
        let resourceType = 'raw';
        if (report.fileUrl.includes('/image/upload/')) {
          resourceType = 'image';
        }
        
        await cloudinary.uploader.destroy(report.cloudinaryId, {
          resource_type: resourceType
        });
        console.log('✅ File deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary delete error:', cloudinaryError.message);
      }
    }

    await report.deleteOne();
    console.log('✅ Report deleted from database');

    ApiResponse.success(res, null, 'Report deleted successfully');
  } catch (error) {
    console.error('❌ Delete Report Error:', error);
    next(error);
  }
};