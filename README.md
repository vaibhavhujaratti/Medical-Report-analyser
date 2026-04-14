# Medical Report Analyser

AI-powered medical report analysis with OCR and dietary recommendations.

## Features
- **OCR Text Extraction:** Tesseract-powered text extraction from medical report images
- **AI-Powered Analysis:** Complete medical analysis using Hugging Face Meta-Llama-3-8B-Instruct model
- **Intelligent Interpretation:** AI identifies abnormal values, interprets findings, and provides context
- **No Hard-Coded Rules:** AI dynamically analyzes any medical parameter without predefined thresholds
- **Personalized Recommendations:** AI-generated dietary and lifestyle advice tailored to specific findings
- **Comprehensive Analysis:** Covers abnormal values, medical interpretation, health implications, and recommendations
- **Firebase Authentication:** Secure user authentication and authorization
- **Secure File Upload:** Validated uploads (10MB limit, images only) with automatic cleanup
- **Comprehensive CORS:** Production-ready cross-origin configuration
- **Security Headers:** XSS protection, clickjacking prevention, CSP
- **Error Handling:** User-friendly error messages with proper logging
- **Responsive Design:** Works on desktop and mobile devices

## Prerequisites
- Node.js (v14+)
- Python 3.x
- Tesseract OCR

## Installation

### 1. Install Tesseract OCR
**Windows:** Download from https://github.com/UB-Mannheim/tesseract/wiki
**Linux:** `sudo apt-get install tesseract-ocr`
**Mac:** `brew install tesseract`

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Environment Variables
Create `.env` file in `frontend/` directory:
```
HUGGINGFACE_API_KEY=your_key_here
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_domain_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
ALLOWED_ORIGINS=http://localhost:5000
NODE_ENV=development
PORT=5000
PYTHON_CMD=python
```

**Note:** Change `PYTHON_CMD` to `python3` or `py` if needed for your system.

### 4. Run Application
```bash
cd frontend
node app.js
```

## Deployment

1. Set environment variables on hosting platform
2. Install Tesseract OCR on server
3. Update `ALLOWED_ORIGINS` with production domain
4. Set `NODE_ENV=production`

## Tech Stack
- **Frontend:** Express.js, EJS, Bootstrap 5
- **Backend:** Python 3.x, Tesseract OCR
- **AI/ML:** 
  - Hugging Face Inference API
  - Model: Meta-Llama-3-8B-Instruct (8 billion parameters)
  - 100% AI-driven analysis (no hard-coded medical rules)
  - Advanced prompt engineering for structured medical output
- **Authentication:** Firebase Authentication
- **Security:** CORS, CSP, XSS Protection, Security Headers
- **File Processing:** Multer (with validation and size limits)
