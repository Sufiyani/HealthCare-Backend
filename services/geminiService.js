// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse");

// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// class GeminiService {
//   // ✅ Analyze uploaded report
//   static async analyzeReport(fileBuffer, mimeType, reportType, reportName) {
//     try {
//       console.log('📄 Starting report analysis:', { reportName, reportType, mimeType });
      
//       let extractedText = "";

//       // ✅ If PDF → Extract text
//       if (mimeType === "application/pdf") {
//         console.log('📖 Extracting text from PDF...');
//         try {
//           const pdfData = await pdfParse(fileBuffer);
//           extractedText = pdfData.text;
//           console.log('✅ PDF text extracted, length:', extractedText.length);
//         } catch (pdfError) {
//           console.error('❌ PDF parsing failed:', pdfError);
//           return {
//             success: false,
//             error: "Failed to read PDF file. Please ensure the file is not corrupted or password-protected."
//           };
//         }
//       } else if (mimeType.startsWith("image/")) {
//         console.log('🖼️ Attempting OCR on image...');
//         extractedText = await this.extractTextFromImage(fileBuffer);
//       } else {
//         return {
//           success: false,
//           error: "Unsupported file type. Please upload PDF or image files."
//         };
//       }

//       // ✅ Better validation
//       if (!extractedText || extractedText.trim().length < 40) {
//         console.log('❌ Insufficient text extracted:', extractedText?.length || 0);
//         return {
//           success: false,
//           error: "No readable content found in report. Please ensure the file is clear and contains text."
//         };
//       }

//       console.log('🤖 Sending to Gemini AI for analysis...');

//       const prompt = `
// You are a medical lab report analysis assistant. Analyze this medical report text carefully.

// **CRITICAL: Return ONLY a valid JSON object with no markdown, no backticks, no extra text.**

// Required JSON format:
// {
//   "summaryEnglish": "Brief 2-3 sentence summary in simple English",
//   "summaryUrdu": "2-3 sentences in Roman Urdu (Hinglish style)",
//   "severity": "low",
//   "urgency": "routine",
//   "keyFindings": ["First key finding", "Second key finding", "Third key finding"],
//   "suggestions": ["First health suggestion", "Second health suggestion"],
//   "detailedAnalysisEnglish": "Detailed explanation of the report findings",
//   "detailedAnalysisUrdu": "Roman Urdu mein tafseel"
// }

// **Rules:**
// - severity MUST be exactly one of: "low", "medium", "high"
// - urgency MUST be exactly one of: "routine", "soon", "urgent"
// - summaryEnglish MUST be at least 50 characters
// - summaryUrdu MUST be in Roman Urdu (transliterated Urdu using English letters)
// - If findings are normal, say so clearly
// - keyFindings should contain 3-5 specific observations from the report
// - suggestions should be general health advice, not medical diagnosis

// Report Metadata:
// - Name: ${reportName}
// - Type: ${reportType}

// Report Content:
// ${extractedText.substring(0, 15000)}

// Return ONLY the JSON object, nothing else.
// `;

//       const model = genAI.getGenerativeModel({
//         // 🛠️ Updated to the correct, working model
//         model: "gemini-2.5-flash",
//         generationConfig: { temperature: 0.3 }
//       });

//       const result = await model.generateContent(prompt);
//       const text = result.response.text().trim();
      
//       console.log('📨 Raw Gemini response:', text.substring(0, 200) + '...');

//       // ✅ Extract JSON from response
//       let cleaned = text.replace(/```json|```/g, "").trim();
//       const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
//       if (!jsonMatch) {
//         console.error('❌ No JSON found in response:', text);
//         throw new Error("AI did not return valid JSON format");
//       }

//       const jsonStr = jsonMatch[0];
//       console.log('🔍 Extracted JSON:', jsonStr.substring(0, 200) + '...');

//       let analysis;
//       try {
//         analysis = JSON.parse(jsonStr);
//       } catch (parseError) {
//         console.error('❌ JSON parse error:', parseError);
//         console.error('Attempted to parse:', jsonStr);
//         throw new Error("Invalid JSON from AI: " + parseError.message);
//       }

//       // ✅ Validate required fields
//       const required = ['summaryEnglish', 'summaryUrdu', 'severity', 'urgency', 'keyFindings', 'suggestions'];
//       const missing = required.filter(field => !analysis[field]);
      
//       if (missing.length > 0) {
//         console.error('❌ Missing required fields:', missing);
//         console.error('Received analysis:', analysis);
//         throw new Error(`AI response missing fields: ${missing.join(', ')}`);
//       }

//       // ✅ Validate enum values
//       const validSeverity = ['low', 'medium', 'high'];
//       const validUrgency = ['routine', 'soon', 'urgent'];
      
//       if (!validSeverity.includes(analysis.severity)) analysis.severity = 'low';
//       if (!validUrgency.includes(analysis.urgency)) analysis.urgency = 'routine';
//       if (!Array.isArray(analysis.keyFindings)) analysis.keyFindings = [];
//       if (!Array.isArray(analysis.suggestions)) analysis.suggestions = [];

//       console.log('✅ Analysis complete:', {
//         summaryLength: analysis.summaryEnglish?.length,
//         severity: analysis.severity,
//         urgency: analysis.urgency,
//         findingsCount: analysis.keyFindings?.length,
//         suggestionsCount: analysis.suggestions?.length
//       });

//       return { success: true, analysis };

//     } catch (error) {
//       console.error("❌ Gemini Analysis Error:", error);
//       console.error("Error stack:", error.stack);
      
//       return {
//         success: false,
//         error: `Analysis failed: ${error.message}. Please try uploading the report again.`
//       };
//     }
//   }

 

//   // ✅ Chat about report
//   static async chatAboutReport(reportAnalysis, conversationHistory, userQuestion) {
//     try {
//       console.log('💬 Chat request:', {
//         question: userQuestion.substring(0, 50),
//         historyLength: conversationHistory.length
//       });

//       if (!reportAnalysis || !reportAnalysis.summaryEnglish) {
//         console.error('❌ Invalid report analysis provided');
//         return {
//           success: false,
//           error: "Report analysis data is incomplete"
//         };
//       }

//       const model = genAI.getGenerativeModel({
//         // 🛠️ Updated to the correct, working model
//         model: "gemini-2.5-flash",
//         generationConfig: { temperature: 0.7 }
//       });

//       const previousChat = conversationHistory
//         .slice(-6)
//         .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
//         .join("\n");

//       const prompt = `
// You are a friendly medical report assistant helping someone understand their lab report.

// **Report Summary:**
// English: ${reportAnalysis.summaryEnglish}
// Roman Urdu: ${reportAnalysis.summaryUrdu || 'N/A'}
// Severity: ${reportAnalysis.severity}
// Urgency: ${reportAnalysis.urgency}

// **Key Findings:**
// ${reportAnalysis.keyFindings?.join('\n') || 'Not available'}

// **Previous Conversation:**
// ${previousChat || "This is the first message"}

// **Current User Question:**
// ${userQuestion}

// **Instructions:**
// 1. If user writes in Roman Urdu/Urdu → reply in Roman Urdu
// 2. If user writes in English → reply in English
// 3. Keep answers SHORT (2-4 sentences maximum)
// 4. Be reassuring and friendly
// 5. NEVER diagnose diseases - only explain report findings
// 6. If user seems worried, always end with: "Agar concern ho to doctor se zaroor consult karein" (in Urdu) or "Please consult your doctor if you have concerns" (in English)
// 7. Use simple, non-technical language
// 8. If asked about specific values, explain if they're normal or abnormal based on the report

// Answer naturally and helpfully:
// `;

//       const result = await model.generateContent(prompt);
//       const answer = result.response.text().trim();
      
//       console.log('✅ Chat response generated:', answer.substring(0, 100));

//       return { success: true, answer };

//     } catch (error) {
//       console.error("❌ Gemini Chat Error:", error);
      
//       return {
//         success: false,
//         error: "Unable to generate response. Please try again.",
//         answer: "I'm having trouble responding right now. Please try asking again in a moment."
//       };
//     }
//   }

// // Add this method to your GeminiService class (after chatAboutReport method)

// static async getHealthTips(vitalData) {
//   try {
//     console.log('💡 Generating health tips for vital data...');

//     if (!vitalData) {
//       return {
//         success: false,
//         error: "No vital data provided"
//       };
//     }

//     const model = genAI.getGenerativeModel({
//       model: "gemini-2.5-flash",
//       generationConfig: { temperature: 0.7 }
//     });

//     // Build vital information string
//     const vitalInfo = [];
//     if (vitalData.bloodPressure) vitalInfo.push(`Blood Pressure: ${vitalData.bloodPressure}`);
//     if (vitalData.bloodSugar) vitalInfo.push(`Blood Sugar: ${vitalData.bloodSugar} mg/dL`);
//     if (vitalData.weight) vitalInfo.push(`Weight: ${vitalData.weight} kg`);
//     if (vitalData.temperature) vitalInfo.push(`Temperature: ${vitalData.temperature}°F`);
//     if (vitalData.heartRate) vitalInfo.push(`Heart Rate: ${vitalData.heartRate} bpm`);
//     if (vitalData.notes) vitalInfo.push(`Notes: ${vitalData.notes}`);

//     const prompt = `
// You are a health assistant providing personalized health tips based on vital signs.

// **CRITICAL: Return ONLY a valid JSON object with no markdown, no backticks, no extra text.**

// Vital Signs:
// ${vitalInfo.join('\n')}

// Analyze these vitals and provide health tips. Return in this exact JSON format:
// {
//   "tipsEnglish": ["Tip 1 in English", "Tip 2 in English", "Tip 3 in English"],
//   "tipsUrdu": ["Tip 1 in Roman Urdu", "Tip 2 in Roman Urdu", "Tip 3 in Roman Urdu"],
//   "overallStatus": "good",
//   "alerts": ["Alert 1 if any concerns", "Alert 2 if any concerns"]
// }

// **Rules:**
// - overallStatus MUST be exactly one of: "good", "fair", "concerning"
// - Provide 3-5 practical, actionable health tips
// - If any values are abnormal, mention it in alerts array
// - If all values are normal, alerts should be an empty array
// - Tips should be encouraging and specific
// - Use simple, friendly language
// - NEVER diagnose diseases - only provide general wellness advice
// - Always add disclaimer: "Consult doctor for medical advice"

// Return ONLY the JSON object, nothing else.
// `;

//     const result = await model.generateContent(prompt);
//     const text = result.response.text().trim();
    
//     console.log('📨 Raw health tips response:', text.substring(0, 200) + '...');

//     // Extract JSON from response
//     let cleaned = text.replace(/```json|```/g, "").trim();
//     const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    
//     if (!jsonMatch) {
//       console.error('❌ No JSON found in response:', text);
//       throw new Error("AI did not return valid JSON format");
//     }

//     const jsonStr = jsonMatch[0];
//     let tips;
    
//     try {
//       tips = JSON.parse(jsonStr);
//     } catch (parseError) {
//       console.error('❌ JSON parse error:', parseError);
//       throw new Error("Invalid JSON from AI: " + parseError.message);
//     }

//     // Validate and set defaults
//     if (!tips.tipsEnglish || !Array.isArray(tips.tipsEnglish)) {
//       tips.tipsEnglish = ["Keep monitoring your vitals regularly", "Maintain a healthy diet", "Stay hydrated"];
//     }
//     if (!tips.tipsUrdu || !Array.isArray(tips.tipsUrdu)) {
//       tips.tipsUrdu = ["Apne vitals ko regularly check karte rahein", "Sehatmand khana khayen", "Pani zyada piyen"];
//     }
//     if (!['good', 'fair', 'concerning'].includes(tips.overallStatus)) {
//       tips.overallStatus = 'fair';
//     }
//     if (!tips.alerts || !Array.isArray(tips.alerts)) {
//       tips.alerts = [];
//     }

//     console.log('✅ Health tips generated:', {
//       status: tips.overallStatus,
//       tipsCount: tips.tipsEnglish.length,
//       alertsCount: tips.alerts.length
//     });

//     return { success: true, tips };

//   } catch (error) {
//     console.error("❌ Gemini Health Tips Error:", error);
    
//     // Fallback tips
//     return {
//       success: true,
//       tips: {
//         tipsEnglish: [
//           "Monitor your vitals regularly",
//           "Maintain a balanced diet",
//           "Stay physically active",
//           "Get adequate sleep"
//         ],
//         tipsUrdu: [
//           "Apne vitals regularly check karein",
//           "Balanced diet maintain karein",
//           "Physical activity jaroor karein",
//           "Proper neend lein"
//         ],
//         overallStatus: "fair",
//         alerts: []
//       }
//     };
//   }
// }

//   // ✅ Placeholder OCR for images
//   static async extractTextFromImage(fileBuffer) {
//     console.log('⚠️ OCR not implemented yet');
//     return "OCR feature is not enabled yet. Please upload PDF reports for now.";
//   }
// }

// export default GeminiService;


// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse");

// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// class GeminiService {
//   // ✅ Analyze uploaded report with improved PDF handling
//   static async analyzeReport(fileBuffer, mimeType, reportType, reportName) {
//     try {
//       console.log('📄 Starting report analysis:', { reportName, reportType, mimeType });
      
//       let extractedText = "";

//       // ✅ Enhanced PDF handling
//       if (mimeType === "application/pdf") {
//         console.log('📖 Extracting text from PDF...');
//         console.log('📏 Buffer size:', fileBuffer.length, 'bytes');
        
//         try {
//           // ✅ Validate buffer before parsing
//           if (!Buffer.isBuffer(fileBuffer)) {
//             console.error('❌ Invalid buffer type:', typeof fileBuffer);
//             throw new Error("Invalid file buffer");
//           }

//           if (fileBuffer.length === 0) {
//             console.error('❌ Empty buffer');
//             throw new Error("Empty file received");
//           }

//           // ✅ Try parsing with better error handling
//           const pdfData = await pdfParse(fileBuffer, {
//             // Add options for better compatibility
//             max: 0, // No page limit
//             version: 'v2.0.550' // Use newer PDF.js version if available
//           });
          
//           extractedText = pdfData.text;
          
//           console.log('✅ PDF parsed successfully');
//           console.log('📊 PDF Info:', {
//             pages: pdfData.numpages,
//             textLength: extractedText.length,
//             hasText: extractedText.trim().length > 0,
//             firstChars: extractedText.substring(0, 100).replace(/\s+/g, ' ')
//           });

//           // ✅ Check if PDF is scanned (image-based)
//           if (extractedText.trim().length < 100) {
//             console.log('⚠️ Very little text extracted - PDF might be scanned/image-based');
            
//             // Try using Gemini Vision API for scanned PDFs
//             return await this.analyzeScannedPDF(fileBuffer, reportType, reportName);
//           }

//         } catch (pdfError) {
//           console.error('❌ PDF parsing failed:', {
//             error: pdfError.message,
//             stack: pdfError.stack,
//             bufferSize: fileBuffer.length
//           });

//           // ✅ If text extraction fails, try image-based analysis
//           console.log('🔄 Attempting image-based analysis for scanned PDF...');
//           return await this.analyzeScannedPDF(fileBuffer, reportType, reportName);
//         }
//       } 
//       else if (mimeType.startsWith("image/")) {
//         console.log('🖼️ Processing image file...');
//         return await this.analyzeImageReport(fileBuffer, mimeType, reportType, reportName);
//       } 
//       else {
//         return {
//           success: false,
//           error: "Unsupported file type. Please upload PDF or image files (PNG, JPG, JPEG)."
//         };
//       }

//       // ✅ Better validation for extracted text
//       const cleanText = extractedText.trim();
      
//       if (cleanText.length < 40) {
//         console.log('❌ Insufficient text extracted:', cleanText.length, 'characters');
//         console.log('📝 Extracted text:', cleanText);
        
//         return {
//           success: false,
//           error: "No readable text found in the PDF. If this is a scanned document, please ensure the image quality is clear."
//         };
//       }

//       console.log('🤖 Sending to Gemini AI for analysis...');

//       const prompt = `
// You are a medical lab report analysis assistant. Analyze this medical report text carefully.

// **CRITICAL: Return ONLY a valid JSON object with no markdown, no backticks, no extra text.**

// Required JSON format:
// {
//   "summaryEnglish": "Brief 2-3 sentence summary in simple English",
//   "summaryUrdu": "2-3 sentences in Roman Urdu (Hinglish style)",
//   "severity": "low",
//   "urgency": "routine",
//   "keyFindings": ["First key finding", "Second key finding", "Third key finding"],
//   "suggestions": ["First health suggestion", "Second health suggestion"],
//   "detailedAnalysisEnglish": "Detailed explanation of the report findings",
//   "detailedAnalysisUrdu": "Roman Urdu mein tafseel"
// }

// **Rules:**
// - severity MUST be exactly one of: "low", "medium", "high"
// - urgency MUST be exactly one of: "routine", "soon", "urgent"
// - summaryEnglish MUST be at least 50 characters
// - summaryUrdu MUST be in Roman Urdu (transliterated Urdu using English letters)
// - If findings are normal, say so clearly
// - keyFindings should contain 3-5 specific observations from the report
// - suggestions should be general health advice, not medical diagnosis

// Report Metadata:
// - Name: ${reportName}
// - Type: ${reportType}

// Report Content:
// ${extractedText.substring(0, 15000)}

// Return ONLY the JSON object, nothing else.
// `;

//       const model = genAI.getGenerativeModel({
//         model: "gemini-2.0-flash-exp",
//         generationConfig: { temperature: 0.3 }
//       });

//       const result = await model.generateContent(prompt);
//       const text = result.response.text().trim();
      
//       console.log('📨 Raw Gemini response:', text.substring(0, 200) + '...');

//       // ✅ Extract JSON from response
//       let cleaned = text.replace(/```json|```/g, "").trim();
//       const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
//       if (!jsonMatch) {
//         console.error('❌ No JSON found in response:', text);
//         throw new Error("AI did not return valid JSON format");
//       }

//       const jsonStr = jsonMatch[0];
//       console.log('🔍 Extracted JSON:', jsonStr.substring(0, 200) + '...');

//       let analysis;
//       try {
//         analysis = JSON.parse(jsonStr);
//       } catch (parseError) {
//         console.error('❌ JSON parse error:', parseError);
//         console.error('Attempted to parse:', jsonStr);
//         throw new Error("Invalid JSON from AI: " + parseError.message);
//       }

//       // ✅ Validate required fields
//       const required = ['summaryEnglish', 'summaryUrdu', 'severity', 'urgency', 'keyFindings', 'suggestions'];
//       const missing = required.filter(field => !analysis[field]);
      
//       if (missing.length > 0) {
//         console.error('❌ Missing required fields:', missing);
//         console.error('Received analysis:', analysis);
//         throw new Error(`AI response missing fields: ${missing.join(', ')}`);
//       }

//       // ✅ Validate enum values
//       const validSeverity = ['low', 'medium', 'high'];
//       const validUrgency = ['routine', 'soon', 'urgent'];
      
//       if (!validSeverity.includes(analysis.severity)) analysis.severity = 'low';
//       if (!validUrgency.includes(analysis.urgency)) analysis.urgency = 'routine';
//       if (!Array.isArray(analysis.keyFindings)) analysis.keyFindings = [];
//       if (!Array.isArray(analysis.suggestions)) analysis.suggestions = [];

//       console.log('✅ Analysis complete:', {
//         summaryLength: analysis.summaryEnglish?.length,
//         severity: analysis.severity,
//         urgency: analysis.urgency,
//         findingsCount: analysis.keyFindings?.length,
//         suggestionsCount: analysis.suggestions?.length
//       });

//       return { success: true, analysis };

//     } catch (error) {
//       console.error("❌ Gemini Analysis Error:", error);
//       console.error("Error stack:", error.stack);
      
//       return {
//         success: false,
//         error: `Analysis failed: ${error.message}. Please try uploading the report again.`
//       };
//     }
//   }

//   // ✅ NEW: Handle scanned PDFs and images using Gemini Vision
//   static async analyzeScannedPDF(fileBuffer, reportType, reportName) {
//     try {
//       console.log('🔍 Analyzing scanned PDF with Gemini Vision...');
      
//       // Convert buffer to base64
//       const base64Data = fileBuffer.toString('base64');
      
//       const model = genAI.getGenerativeModel({
//         model: "gemini-2.0-flash-exp",
//         generationConfig: { temperature: 0.3 }
//       });

//       const prompt = `
// You are analyzing a medical lab report image/scanned document.

// **CRITICAL: Return ONLY a valid JSON object with no markdown, no backticks, no extra text.**

// Extract all text and medical information from this report image and analyze it.

// Return in this exact JSON format:
// {
//   "summaryEnglish": "Brief 2-3 sentence summary in simple English",
//   "summaryUrdu": "2-3 sentences in Roman Urdu",
//   "severity": "low",
//   "urgency": "routine",
//   "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
//   "suggestions": ["Suggestion 1", "Suggestion 2"],
//   "detailedAnalysisEnglish": "Detailed explanation",
//   "detailedAnalysisUrdu": "Roman Urdu mein tafseel"
// }

// Report Metadata:
// - Name: ${reportName}
// - Type: ${reportType}

// Rules:
// - severity: "low", "medium", or "high"
// - urgency: "routine", "soon", or "urgent"
// - Extract all visible test results and values
// - Identify abnormal values if any
// - Provide clear health advice

// Return ONLY the JSON object.
// `;

//       const result = await model.generateContent([
//         prompt,
//         {
//           inlineData: {
//             data: base64Data,
//             mimeType: "application/pdf"
//           }
//         }
//       ]);

//       const text = result.response.text().trim();
//       console.log('📨 Vision API response:', text.substring(0, 200));

//       // Parse JSON response
//       let cleaned = text.replace(/```json|```/g, "").trim();
//       const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
//       if (!jsonMatch) {
//         throw new Error("Vision API did not return valid JSON");
//       }

//       const analysis = JSON.parse(jsonMatch[0]);
      
//       // Validate and set defaults
//       const validSeverity = ['low', 'medium', 'high'];
//       const validUrgency = ['routine', 'soon', 'urgent'];
      
//       if (!validSeverity.includes(analysis.severity)) analysis.severity = 'low';
//       if (!validUrgency.includes(analysis.urgency)) analysis.urgency = 'routine';
//       if (!Array.isArray(analysis.keyFindings)) analysis.keyFindings = [];
//       if (!Array.isArray(analysis.suggestions)) analysis.suggestions = [];

//       console.log('✅ Vision analysis complete');
//       return { success: true, analysis };

//     } catch (error) {
//       console.error('❌ Vision API error:', error);
      
//       return {
//         success: false,
//         error: "Unable to read scanned document. Please ensure the image is clear and not password-protected."
//       };
//     }
//   }

//   // ✅ NEW: Handle image reports
//   static async analyzeImageReport(fileBuffer, mimeType, reportType, reportName) {
//     try {
//       console.log('🖼️ Analyzing image report with Gemini Vision...');
      
//       const base64Data = fileBuffer.toString('base64');
      
//       const model = genAI.getGenerativeModel({
//         model: "gemini-2.0-flash-exp",
//         generationConfig: { temperature: 0.3 }
//       });

//       const prompt = `
// Analyze this medical report image and extract all information.

// **Return ONLY valid JSON with no markdown or backticks.**

// {
//   "summaryEnglish": "Brief summary",
//   "summaryUrdu": "Roman Urdu summary",
//   "severity": "low",
//   "urgency": "routine",
//   "keyFindings": ["Finding 1", "Finding 2"],
//   "suggestions": ["Suggestion 1", "Suggestion 2"],
//   "detailedAnalysisEnglish": "Detailed analysis",
//   "detailedAnalysisUrdu": "Tafseel Roman Urdu mein"
// }

// Report: ${reportName} (${reportType})
// `;

//       const result = await model.generateContent([
//         prompt,
//         {
//           inlineData: {
//             data: base64Data,
//             mimeType: mimeType
//           }
//         }
//       ]);

//       const text = result.response.text().trim();
//       let cleaned = text.replace(/```json|```/g, "").trim();
//       const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
//       if (!jsonMatch) throw new Error("Invalid JSON from Vision API");
      
//       const analysis = JSON.parse(jsonMatch[0]);
      
//       // Set defaults
//       if (!['low', 'medium', 'high'].includes(analysis.severity)) analysis.severity = 'low';
//       if (!['routine', 'soon', 'urgent'].includes(analysis.urgency)) analysis.urgency = 'routine';
//       if (!Array.isArray(analysis.keyFindings)) analysis.keyFindings = [];
//       if (!Array.isArray(analysis.suggestions)) analysis.suggestions = [];

//       return { success: true, analysis };

//     } catch (error) {
//       console.error('❌ Image analysis error:', error);
//       return {
//         success: false,
//         error: "Unable to analyze image. Please ensure it's clear and readable."
//       };
//     }
//   }

//   // ✅ Chat about report
//   static async chatAboutReport(reportAnalysis, conversationHistory, userQuestion) {
//     try {
//       console.log('💬 Chat request:', {
//         question: userQuestion.substring(0, 50),
//         historyLength: conversationHistory.length
//       });

//       if (!reportAnalysis || !reportAnalysis.summaryEnglish) {
//         console.error('❌ Invalid report analysis provided');
//         return {
//           success: false,
//           error: "Report analysis data is incomplete"
//         };
//       }

//       const model = genAI.getGenerativeModel({
//         model: "gemini-2.0-flash-exp",
//         generationConfig: { temperature: 0.7 }
//       });

//       const previousChat = conversationHistory
//         .slice(-6)
//         .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
//         .join("\n");

//       const prompt = `
// You are a friendly medical report assistant helping someone understand their lab report.

// **Report Summary:**
// English: ${reportAnalysis.summaryEnglish}
// Roman Urdu: ${reportAnalysis.summaryUrdu || 'N/A'}
// Severity: ${reportAnalysis.severity}
// Urgency: ${reportAnalysis.urgency}

// **Key Findings:**
// ${reportAnalysis.keyFindings?.join('\n') || 'Not available'}

// **Previous Conversation:**
// ${previousChat || "This is the first message"}

// **Current User Question:**
// ${userQuestion}

// **Instructions:**
// 1. If user writes in Roman Urdu/Urdu → reply in Roman Urdu
// 2. If user writes in English → reply in English
// 3. Keep answers SHORT (2-4 sentences maximum)
// 4. Be reassuring and friendly
// 5. NEVER diagnose diseases - only explain report findings
// 6. If user seems worried, always end with: "Agar concern ho to doctor se zaroor consult karein" (in Urdu) or "Please consult your doctor if you have concerns" (in English)
// 7. Use simple, non-technical language
// 8. If asked about specific values, explain if they're normal or abnormal based on the report

// Answer naturally and helpfully:
// `;

//       const result = await model.generateContent(prompt);
//       const answer = result.response.text().trim();
      
//       console.log('✅ Chat response generated:', answer.substring(0, 100));

//       return { success: true, answer };

//     } catch (error) {
//       console.error("❌ Gemini Chat Error:", error);
      
//       return {
//         success: false,
//         error: "Unable to generate response. Please try again.",
//         answer: "I'm having trouble responding right now. Please try asking again in a moment."
//       };
//     }
//   }

//   // ✅ Health tips for vitals
//   static async getHealthTips(vitalData) {
//     try {
//       console.log('💡 Generating health tips for vital data...');

//       if (!vitalData) {
//         return {
//           success: false,
//           error: "No vital data provided"
//         };
//       }

//       const model = genAI.getGenerativeModel({
//         model: "gemini-2.0-flash-exp",
//         generationConfig: { temperature: 0.7 }
//       });

//       const vitalInfo = [];
//       if (vitalData.bloodPressure) vitalInfo.push(`Blood Pressure: ${vitalData.bloodPressure}`);
//       if (vitalData.bloodSugar) vitalInfo.push(`Blood Sugar: ${vitalData.bloodSugar} mg/dL`);
//       if (vitalData.weight) vitalInfo.push(`Weight: ${vitalData.weight} kg`);
//       if (vitalData.temperature) vitalInfo.push(`Temperature: ${vitalData.temperature}°F`);
//       if (vitalData.heartRate) vitalInfo.push(`Heart Rate: ${vitalData.heartRate} bpm`);
//       if (vitalData.notes) vitalInfo.push(`Notes: ${vitalData.notes}`);

//       const prompt = `
// Analyze these vitals and provide health tips.

// **Return ONLY valid JSON:**
// {
//   "tipsEnglish": ["Tip 1", "Tip 2", "Tip 3"],
//   "tipsUrdu": ["Tip 1 Roman Urdu", "Tip 2 Roman Urdu"],
//   "overallStatus": "good",
//   "alerts": []
// }

// Vitals:
// ${vitalInfo.join('\n')}

// Rules:
// - overallStatus: "good", "fair", or "concerning"
// - 3-5 actionable tips
// - Alert if abnormal values
// - Simple, friendly language
// `;

//       const result = await model.generateContent(prompt);
//       const text = result.response.text().trim();
      
//       let cleaned = text.replace(/```json|```/g, "").trim();
//       const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
//       if (!jsonMatch) throw new Error("Invalid JSON");
      
//       const tips = JSON.parse(jsonMatch[0]);
      
//       // Set defaults
//       if (!Array.isArray(tips.tipsEnglish)) tips.tipsEnglish = ["Monitor vitals regularly"];
//       if (!Array.isArray(tips.tipsUrdu)) tips.tipsUrdu = ["Vitals check karte rahein"];
//       if (!['good', 'fair', 'concerning'].includes(tips.overallStatus)) tips.overallStatus = 'fair';
//       if (!Array.isArray(tips.alerts)) tips.alerts = [];

//       return { success: true, tips };

//     } catch (error) {
//       console.error("❌ Health Tips Error:", error);
      
//       return {
//         success: true,
//         tips: {
//           tipsEnglish: ["Monitor vitals regularly", "Maintain balanced diet", "Stay active"],
//           tipsUrdu: ["Vitals check karein", "Balanced diet lein", "Active rahein"],
//           overallStatus: "fair",
//           alerts: []
//         }
//       };
//     }
//   }
// }

// export default GeminiService;




import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  // ✅ UNIVERSAL PDF/IMAGE ANALYZER - Works for ALL types
  static async analyzeReport(fileBuffer, mimeType, reportType, reportName) {
    try {
      console.log('📄 Starting report analysis:', { reportName, reportType, mimeType });
      
      // ✅ Step 1: Try extracting text from PDF first
      let extractedText = "";
      let useVisionAPI = false;

      if (mimeType === "application/pdf") {
        console.log('📖 Attempting text extraction from PDF...');
        
        try {
          if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
            throw new Error("Invalid or empty file buffer");
          }

          const pdfData = await pdf(fileBuffer, {
            max: 0, // No page limit
          });
          
          extractedText = pdfData.text.trim();
          
          console.log('📊 PDF Info:', {
            pages: pdfData.numpages,
            textLength: extractedText.length,
            firstChars: extractedText.substring(0, 150).replace(/\s+/g, ' ')
          });

          // ✅ If PDF has good text content, use text-based analysis
          if (extractedText.length >= 100) {
            console.log('✅ Using text-based analysis (normal PDF)');
            return await this.analyzeTextReport(extractedText, reportType, reportName);
          } else {
            console.log('⚠️ Very little text found - switching to Vision API');
            useVisionAPI = true;
          }

        } catch (pdfError) {
          console.error('⚠️ PDF text extraction failed:', pdfError.message);
          console.log('🔄 Falling back to Vision API for scanned/image-based PDF');
          useVisionAPI = true;
        }
      }

      // ✅ Step 2: Use Vision API for scanned PDFs or images
      if (useVisionAPI || mimeType.startsWith("image/")) {
        console.log('🖼️ Using Vision API for analysis...');
        return await this.analyzeWithVision(fileBuffer, mimeType, reportType, reportName);
      }

      // ✅ Step 3: Unsupported file type
      return {
        success: false,
        error: "Unsupported file type. Please upload PDF or image files (PNG, JPG, JPEG)."
      };

    } catch (error) {
      console.error("❌ Analysis Error:", error);
      console.error("Stack:", error.stack);
      
      return {
        success: false,
        error: `Analysis failed: ${error.message}. Please try uploading again.`
      };
    }
  }

  // ✅ Text-based analysis for normal PDFs with readable text
  static async analyzeTextReport(extractedText, reportType, reportName) {
    try {
      console.log('🤖 Analyzing text content with Gemini...');

      const prompt = `
You are a medical lab report analysis assistant. Analyze this medical report carefully.

**CRITICAL: Return ONLY a valid JSON object. No markdown, no backticks, no extra text.**

Required JSON format:
{
  "summaryEnglish": "Brief 2-3 sentence summary in simple English",
  "summaryUrdu": "2-3 sentences in Roman Urdu (Hinglish style)",
  "severity": "low",
  "urgency": "routine",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "detailedAnalysisEnglish": "Detailed explanation of findings",
  "detailedAnalysisUrdu": "Roman Urdu mein tafseel"
}

**Rules:**
- severity: MUST be "low", "medium", or "high"
- urgency: MUST be "routine", "soon", or "urgent"
- summaryEnglish: at least 50 characters
- summaryUrdu: in Roman Urdu (English letters, Urdu words)
- keyFindings: 3-5 specific observations
- suggestions: general health advice only

Report: ${reportName} (${reportType})

Content:
${extractedText.substring(0, 15000)}

Return ONLY the JSON object.
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // ✅ Latest stable model (June 2025)
        generationConfig: { temperature: 0.3 }
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      console.log('📨 Gemini response received');

      return this.parseAndValidateAnalysis(text);

    } catch (error) {
      console.error('❌ Text analysis failed:', error);
      throw error;
    }
  }

  // ✅ Vision API for scanned PDFs and images
  static async analyzeWithVision(fileBuffer, mimeType, reportType, reportName) {
    try {
      console.log('🔍 Analyzing with Vision API...');
      
      const base64Data = fileBuffer.toString('base64');
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // ✅ Latest stable with vision
        generationConfig: { temperature: 0.3 }
      });

      const prompt = `
Analyze this medical lab report image/scanned document.

**CRITICAL: Return ONLY valid JSON. No markdown, no backticks.**

{
  "summaryEnglish": "Brief 2-3 sentence summary",
  "summaryUrdu": "2-3 sentences Roman Urdu mein",
  "severity": "low",
  "urgency": "routine",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "detailedAnalysisEnglish": "Detailed explanation",
  "detailedAnalysisUrdu": "Roman Urdu mein tafseel"
}

Report: ${reportName} (${reportType})

Rules:
- Extract ALL visible test results and values
- severity: "low"/"medium"/"high"
- urgency: "routine"/"soon"/"urgent"
- Identify any abnormal values
- Provide clear, simple health advice

Return ONLY the JSON object.
`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ]);

      const text = result.response.text().trim();
      console.log('📨 Vision API response received');

      return this.parseAndValidateAnalysis(text);

    } catch (error) {
      console.error('❌ Vision API failed:', error);
      
      return {
        success: false,
        error: "Unable to analyze the document. Please ensure the image is clear and not password-protected."
      };
    }
  }

  // ✅ Parse and validate JSON response
  static parseAndValidateAnalysis(text) {
    try {
      console.log('🔍 Parsing AI response...');

      // Remove markdown and extract JSON
      let cleaned = text.replace(/```json|```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('❌ No JSON found in response');
        throw new Error("AI did not return valid JSON format");
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // ✅ Validate required fields
      const required = ['summaryEnglish', 'summaryUrdu', 'severity', 'urgency', 'keyFindings', 'suggestions'];
      const missing = required.filter(field => !analysis[field]);
      
      if (missing.length > 0) {
        console.error('❌ Missing fields:', missing);
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      // ✅ Validate and fix enum values
      const validSeverity = ['low', 'medium', 'high'];
      const validUrgency = ['routine', 'soon', 'urgent'];
      
      if (!validSeverity.includes(analysis.severity)) {
        console.log('⚠️ Invalid severity, defaulting to "low"');
        analysis.severity = 'low';
      }
      
      if (!validUrgency.includes(analysis.urgency)) {
        console.log('⚠️ Invalid urgency, defaulting to "routine"');
        analysis.urgency = 'routine';
      }
      
      if (!Array.isArray(analysis.keyFindings)) {
        analysis.keyFindings = [];
      }
      
      if (!Array.isArray(analysis.suggestions)) {
        analysis.suggestions = [];
      }

      console.log('✅ Analysis validated:', {
        severity: analysis.severity,
        urgency: analysis.urgency,
        findingsCount: analysis.keyFindings.length,
        suggestionsCount: analysis.suggestions.length
      });

      return { success: true, analysis };

    } catch (error) {
      console.error('❌ Parse/validation error:', error);
      throw error;
    }
  }

  // ✅ Chat about report
  static async chatAboutReport(reportAnalysis, conversationHistory, userQuestion) {
    try {
      console.log('💬 Processing chat question...');

      if (!reportAnalysis || !reportAnalysis.summaryEnglish) {
        return {
          success: false,
          error: "Report analysis data is incomplete"
        };
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.7 }
      });

      const previousChat = conversationHistory
        .slice(-6)
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      const prompt = `
You are a friendly medical report assistant.

**Report Summary:**
English: ${reportAnalysis.summaryEnglish}
Roman Urdu: ${reportAnalysis.summaryUrdu || 'N/A'}
Severity: ${reportAnalysis.severity}
Urgency: ${reportAnalysis.urgency}

**Key Findings:**
${reportAnalysis.keyFindings?.join('\n') || 'None'}

**Previous Chat:**
${previousChat || "First message"}

**User Question:**
${userQuestion}

**Instructions:**
1. Roman Urdu question → Roman Urdu answer
2. English question → English answer
3. Keep answers SHORT (2-4 sentences max)
4. Be reassuring and friendly
5. NEVER diagnose - only explain findings
6. If worried, add: "Doctor se consult karein" (Urdu) or "Consult your doctor" (English)
7. Simple language only

Answer:
`;

      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();
      
      console.log('✅ Chat response generated');

      return { success: true, answer };

    } catch (error) {
      console.error("❌ Chat Error:", error);
      
      return {
        success: false,
        error: "Unable to respond. Please try again.",
        answer: "I'm having trouble right now. Please try asking again."
      };
    }
  }

  // ✅ Health tips for vitals
  static async getHealthTips(vitalData) {
    try {
      console.log('💡 Generating health tips...');

      if (!vitalData) {
        return {
          success: false,
          error: "No vital data provided"
        };
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.7 }
      });

      const vitalInfo = [];
      if (vitalData.bloodPressure) vitalInfo.push(`BP: ${vitalData.bloodPressure}`);
      if (vitalData.bloodSugar) vitalInfo.push(`Sugar: ${vitalData.bloodSugar} mg/dL`);
      if (vitalData.weight) vitalInfo.push(`Weight: ${vitalData.weight} kg`);
      if (vitalData.temperature) vitalInfo.push(`Temp: ${vitalData.temperature}°F`);
      if (vitalData.heartRate) vitalInfo.push(`HR: ${vitalData.heartRate} bpm`);
      if (vitalData.notes) vitalInfo.push(`Notes: ${vitalData.notes}`);

      const prompt = `
Analyze vitals and provide tips.

**Return ONLY valid JSON:**
{
  "tipsEnglish": ["Tip 1", "Tip 2", "Tip 3"],
  "tipsUrdu": ["Tip 1 Roman Urdu", "Tip 2 Roman Urdu"],
  "overallStatus": "good",
  "alerts": []
}

Vitals:
${vitalInfo.join('\n')}

Rules:
- overallStatus: "good"/"fair"/"concerning"
- 3-5 actionable tips
- Alert if abnormal
- Simple language
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      let cleaned = text.replace(/```json|```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error("Invalid JSON");
      
      const tips = JSON.parse(jsonMatch[0]);
      
      // Set defaults
      if (!Array.isArray(tips.tipsEnglish)) {
        tips.tipsEnglish = ["Monitor vitals regularly"];
      }
      if (!Array.isArray(tips.tipsUrdu)) {
        tips.tipsUrdu = ["Vitals check karte rahein"];
      }
      if (!['good', 'fair', 'concerning'].includes(tips.overallStatus)) {
        tips.overallStatus = 'fair';
      }
      if (!Array.isArray(tips.alerts)) {
        tips.alerts = [];
      }

      return { success: true, tips };

    } catch (error) {
      console.error("❌ Health Tips Error:", error);
      
      return {
        success: true,
        tips: {
          tipsEnglish: ["Monitor vitals regularly", "Balanced diet", "Stay active"],
          tipsUrdu: ["Vitals check karein", "Balanced diet lein", "Active rahein"],
          overallStatus: "fair",
          alerts: []
        }
      };
    }
  }
}

export default GeminiService;