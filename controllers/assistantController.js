import Report from '../models/Report.js';
import Conversation from '../models/Conversation.js';
import GeminiService from '../services/geminiService.js';
import ApiResponse from '../utils/responses.js';

export const askQuestion = async (req, res, next) => {
  try {
    const { reportId, question } = req.body;

    console.log('💬 Chat Request:', { reportId, question: question.substring(0, 50), userId: req.user._id });

    if (!question || !reportId) {
      return ApiResponse.badRequest(res, 'Please provide question and reportId');
    }

    if (question.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Question cannot be empty');
    }

    // Get report
    const report = await Report.findById(reportId);
    if (!report) {
      console.log('❌ Report not found:', reportId);
      return ApiResponse.notFound(res, 'Report not found');
    }

    console.log('📄 Report found:', report.name);

    // Check ownership
    if (report.user.toString() !== req.user._id.toString()) {
      console.log('❌ Unauthorized access attempt');
      return ApiResponse.forbidden(res, 'Not authorized to access this report');
    }

    // ✅ IMPROVED: Check if analysis is complete with actual data
    if (!report.aiAnalysis) {
      console.log('❌ AI Analysis object missing');
      return ApiResponse.badRequest(
        res, 
        'AI Analysis not started yet. Please go back to reports and wait for analysis to complete.'
      );
    }

    const isAnalysisValid = 
      report.aiAnalysis.summaryEnglish && 
      report.aiAnalysis.summaryEnglish !== 'undefined...' &&
      report.aiAnalysis.summaryEnglish.trim().length > 20 &&
      report.aiAnalysis.severity &&
      report.aiAnalysis.urgency;

    if (!isAnalysisValid) {
      console.log('❌ AI Analysis incomplete or invalid:', {
        hasSummary: !!report.aiAnalysis.summaryEnglish,
        summaryValue: report.aiAnalysis.summaryEnglish?.substring(0, 50),
        summaryLength: report.aiAnalysis.summaryEnglish?.length,
        hasSeverity: !!report.aiAnalysis.severity,
        hasUrgency: !!report.aiAnalysis.urgency
      });
      
      return ApiResponse.badRequest(
        res, 
        'AI Analysis is incomplete or failed. Please try re-uploading your report or contact support if the issue persists.'
      );
    }

    console.log('✅ AI Analysis validated successfully');

    // Get or create conversation
    let conversation = await Conversation.findOne({ 
      user: req.user._id, 
      report: reportId 
    });

    if (!conversation) {
      console.log('📝 Creating new conversation');
      conversation = await Conversation.create({
        user: req.user._id,
        report: reportId,
        messages: []
      });
    } else {
      console.log('📝 Found existing conversation with', conversation.messages.length, 'messages');
    }

    console.log('🤖 Calling Gemini AI...');

    // Get AI response with proper error handling
    let aiResponse;
    try {
      aiResponse = await GeminiService.chatAboutReport(
        report.aiAnalysis,
        conversation.messages,
        question
      );
    } catch (geminiError) {
      console.error('❌ Gemini Service Error:', geminiError);
      return ApiResponse.error(
        res, 
        'AI service is temporarily unavailable. Please try again in a moment.', 
        503
      );
    }

    console.log('📨 AI Response received:', { 
      success: aiResponse?.success, 
      hasAnswer: !!aiResponse?.answer 
    });

    if (!aiResponse || !aiResponse.success) {
      console.error('❌ AI Response failed:', aiResponse?.error);
      
      return ApiResponse.error(
        res, 
        aiResponse?.error || 'Unable to get AI response. Please try again.',
        500
      );
    }

    if (!aiResponse.answer || aiResponse.answer.trim().length === 0) {
      console.error('❌ AI Response has no answer');
      return ApiResponse.error(
        res, 
        'AI returned empty response. Please try rephrasing your question.', 
        500
      );
    }

    console.log('✅ AI Response successful');

    // Add messages to conversation
    conversation.messages.push({
      role: 'user',
      content: question,
      timestamp: new Date()
    });

    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.answer,
      timestamp: new Date()
    });

    await conversation.save();

    console.log('💾 Conversation saved, total messages:', conversation.messages.length);

    return ApiResponse.success(res, {
      answer: aiResponse.answer,
      conversationId: conversation._id,
      messageCount: conversation.messages.length
    }, 'Response generated successfully');

  } catch (error) {
    console.error('❌ Assistant Controller Error:', error);
    console.error('Error stack:', error.stack);
    
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message,
        error: error.stack
      });
    }
    
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    console.log('📖 Fetching conversation for report:', req.params.reportId);
    
    const conversation = await Conversation.findOne({
      user: req.user._id,
      report: req.params.reportId
    });

    if (!conversation) {
      console.log('📭 No conversation found');
      return ApiResponse.success(res, { conversation: null }, 'No conversation yet');
    }

    console.log('✅ Conversation found with', conversation.messages.length, 'messages');

    return ApiResponse.success(res, { conversation });
  } catch (error) {
    console.error('❌ Get Conversation Error:', error);
    next(error);
  }
};

export const clearConversation = async (req, res, next) => {
  try {
    console.log('🗑️ Clearing conversation for report:', req.params.reportId);
    
    const result = await Conversation.findOneAndDelete({
      user: req.user._id,
      report: req.params.reportId
    });

    if (result) {
      console.log('✅ Conversation cleared,', result.messages.length, 'messages deleted');
    } else {
      console.log('📭 No conversation to clear');
    }

    return ApiResponse.success(res, null, 'Conversation cleared successfully');
  } catch (error) {
    console.error('❌ Clear Conversation Error:', error);
    next(error);
  }
};