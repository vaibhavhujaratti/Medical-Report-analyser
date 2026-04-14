import express from "express"
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url"
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import cors from 'cors';
import 'dotenv/config';
import { HfInference } from '@huggingface/inference';

// Validate required environment variables
const requiredEnvVars = [
  'HUGGINGFACE_API_KEY',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`ERROR: Missing required environment variable: ${varName}`);
    console.error('Please check your .env file.');
    process.exit(1);
  }
});

const execPromise = promisify(exec);

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
try {
  await fs.mkdir(uploadsDir, { recursive: true });
} catch (err) {
  console.error('Failed to create uploads directory:', err);
  process.exit(1);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // save files in uploads folder
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent path traversal
    const sanitizedName = path.basename(file.originalname);
    cb(null, Date.now() + '-' + sanitizedName); // unique file name
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Comprehensive CORS Configuration
const corsOptions = {
  // Origin validation
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:5000', 'http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  
  // Exposed response headers (accessible to client)
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'X-Request-Id'
  ],
  
  // Preflight cache duration (in seconds)
  maxAge: 86400, // 24 hours
  
  // Success status for OPTIONS requests
  optionsSuccessStatus: 204,
  
  // Pass CORS preflight to route handlers
  preflightContinue: false
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com;"
    );
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.get('origin') || 'N/A'}`);
  next();
});

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
const port = process.env.PORT || 5000;

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index.ejs");
})


// Helper function to clean up uploaded files
const cleanupFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error('Failed to delete file:', filePath, err);
  }
};

// AI-powered medical report analysis using Hugging Face
const analyzeWithAI = async (reportText) => {
  try {
    console.log('Calling Hugging Face AI for comprehensive medical analysis...');
    
    // Construct the system and user messages for chat completion
    const systemMessage = `You are an expert medical AI assistant specialized in analyzing laboratory reports. You provide structured, professional medical analysis based on lab test results. Always base your analysis only on the visible data and provide specific, actionable recommendations.`;
    
    const userMessage = `Analyze the following medical laboratory report and provide a comprehensive evaluation.

EXTRACTED LABORATORY REPORT:
${reportText.substring(0, 3000)} ${reportText.length > 3000 ? '...(text truncated for brevity)' : ''}

Please provide a STRUCTURED ANALYSIS in the following format:

**IDENTIFIED ABNORMAL VALUES:**
[List any abnormal test results with their values, normal ranges, and whether they are HIGH or LOW. If no abnormalities detected, state "No significant abnormalities detected in the visible data."]

**MEDICAL INTERPRETATION:**
[Provide a professional interpretation of the findings in 2-4 sentences, explaining what these results might indicate about the patient's health status.]

**POTENTIAL HEALTH IMPLICATIONS:**
[Describe potential health concerns or conditions associated with the abnormal findings, if any.]

**DIETARY RECOMMENDATIONS:**
[Provide specific, actionable dietary advice based on the findings. Include foods to eat and foods to avoid. Use emojis for readability: 🥬🥩🐟🥑🍊 etc.]

**LIFESTYLE RECOMMENDATIONS:**
[Suggest lifestyle changes such as exercise, hydration, sleep, stress management, etc.]

IMPORTANT: Be specific with values when available. Keep the tone professional but accessible.`;

    // Using chatCompletion for Meta-Llama-3-8B-Instruct
    const response = await hf.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 800,
      temperature: 0.6,
      top_p: 0.92
    });

    const aiAnalysis = response.choices[0].message.content.trim();
    console.log('AI analysis completed successfully');
    console.log(`Generated ${aiAnalysis.length} characters of analysis`);
    return aiAnalysis;

  } catch (error) {
    console.error('AI analysis error:', error.message);
    console.error('Error details:', error);
    
    // Throw error to be handled by caller
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

app.post("/upload", upload.single("image"), async (req, res) => {
  let uploadedFilePath = null;
  
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).render('error', { 
        message: 'No file uploaded',
        details: 'Please select an image file to upload.'
      });
    }

    uploadedFilePath = path.join(__dirname, 'uploads', req.file.filename);
    const pythonScript = path.join(__dirname, '../backend/read.py');
    const pythonCmd = process.env.PYTHON_CMD || 'python';
    
    // Use unique JSON file to avoid race conditions
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(7);
    const jsonPath = path.join(__dirname, '../backend', `result-${uniqueId}.json`);

    // Execute Python OCR script with timeout
    const ocrCommand = `${pythonCmd} "${pythonScript}" "${uploadedFilePath}" "${jsonPath}"`;
    console.log('Executing OCR command...');
    
    try {
      const { stdout, stderr } = await execPromise(ocrCommand, { timeout: 30000 });
      if (stderr) console.error('Python stderr:', stderr);
      console.log('OCR completed:', stdout);
    } catch (execError) {
      console.error('OCR execution error:', execError);
      await cleanupFile(uploadedFilePath);
      
      if (execError.code === 'ETIMEDOUT') {
        return res.status(500).render('error', {
          message: 'OCR processing timeout',
          details: 'The image processing took too long. Please try with a smaller or clearer image.'
        });
      }
      
      return res.status(500).render('error', {
        message: 'OCR processing failed',
        details: 'Unable to extract text from the image. Please ensure Tesseract OCR is installed and the image is clear.'
      });
    }

    // Read and parse OCR results
    let data;
    try {
      const fileContent = await fs.readFile(jsonPath, 'utf-8');
      data = JSON.parse(fileContent);
      // Clean up the unique JSON file
      await cleanupFile(jsonPath);
    } catch (readError) {
      console.error('Failed to read OCR results:', readError);
      await cleanupFile(uploadedFilePath);
      return res.status(500).render('error', {
        message: 'Failed to process OCR results',
        details: 'The text extraction completed but results could not be read.'
      });
    }

    // Clean up uploaded file after processing
    await cleanupFile(uploadedFilePath);

    // Check if OCR extracted any text
    if (!data.extracted_text || data.extracted_text.length === 0) {
      return res.status(400).render('error', {
        message: 'No text extracted',
        details: 'Could not extract any text from the image. Please ensure the image is clear and contains readable text.'
      });
    }

    const reportText = data.extracted_text.join('\n');

    console.log('Starting AI-powered medical analysis...');
    console.log(`Extracted ${data.line_count} lines of text from report`);

    // Get AI-powered comprehensive analysis
    let aiAnalysis = '';
    let analysisSuccessful = false;
    
    try {
      aiAnalysis = await analyzeWithAI(reportText);
      analysisSuccessful = true;
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      
      // Fallback message if AI completely fails
      aiAnalysis = `**ANALYSIS UNAVAILABLE**\n\nThe AI medical analysis service is currently unavailable. This may be due to:\n• Network connectivity issues\n• API rate limits\n• Service maintenance\n\nPlease try again in a few moments, or consult with a healthcare professional directly for interpretation of your laboratory results.`;
    }

    // Build comprehensive report with AI analysis
    const finalReport = `🏥 MEDICAL REPORT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${aiAnalysis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT MEDICAL DISCLAIMER:

This AI-powered analysis is provided for preliminary informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. 

${analysisSuccessful ? 'While AI can assist in identifying patterns, only qualified healthcare professionals can:' : 'Always consult qualified healthcare professionals for:'}

• Provide accurate interpretation of laboratory results
• Conduct comprehensive medical evaluation
• Make treatment recommendations and prescriptions
• Address your specific health concerns and questions
• Consider your complete medical history and current condition

Do not make medical decisions based solely on this automated analysis. Always seek the advice of your physician or other qualified health provider.`;

    res.render("report.ejs", { analysis: finalReport, extractedText: reportText });

  } catch (error) {
    console.error('Upload route error:', error);
    
    // Clean up file if it exists
    if (uploadedFilePath) {
      await cleanupFile(uploadedFilePath);
    }
    
    // Check if it's a multer error
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).render('error', {
        message: 'File too large',
        details: 'Maximum file size is 10MB. Please upload a smaller image.'
      });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).render('error', {
        message: 'Invalid file type',
        details: 'Only image files (JPEG, PNG, GIF, BMP, TIFF) are allowed.'
      });
    }
    
    // Generic error response
    return res.status(500).render('error', {
      message: 'An error occurred',
      details: 'Unable to process your request. Please try again later.'
    });
  }
});
app.get("/sign", (req, res) => {
  res.render("signup.ejs");
})
app.get("/login", (req, res) => {
  res.render("login.ejs");
})


app.get("/send", (req, res) => {
  res.render("send.ejs");
})


app.get("/cnct", (req, res) => {
  res.render("contact.ejs");
})

app.get("/api/firebase-config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  });
});

// Global error handler for multer and other errors
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).render('error', {
        message: 'File too large',
        details: 'Maximum file size is 10MB. Please upload a smaller image.'
      });
    }
    return res.status(400).render('error', {
      message: 'Upload error',
      details: error.message
    });
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).render('error', {
      message: 'Invalid file type',
      details: 'Only image files (JPEG, PNG, GIF, BMP, TIFF) are allowed.'
    });
  }
  
  return res.status(500).render('error', {
    message: 'Server error',
    details: 'An unexpected error occurred. Please try again later.'
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
