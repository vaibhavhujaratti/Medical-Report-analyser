import express from "express"
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url"
import Tesseract from "tesseract.js";
import send from "send";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
const app =express();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // save files in uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const port = 5000;
// --- SECTION 4: Your EJS and Page Routes ---
// You MUST add your page routes here, or your site won't load
// These are examples, you need to add all your pages
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Example page routes:
app.get('/', (req, res) => {
  res.render('index'); // Renders index.ejs
});

app.get('/login', (req, res) => {
  res.render('login'); // Renders login.ejs
});

app.get('/report', (req, res) => {
  res.render('report'); // Renders report.ejs
});

app.get('/Contacts', (req, res) => {
  res.render('Contact'); // Renders Contact.ejs
});
// ... add all your other pages ...


// --- SECTION 5: NEW OCR Route ---
// This is the new API "brain" that does the OCR
app.post('/scan-report', upload.single('reportImage'), async (req, res) => {
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  console.log('Image received:', req.file.path);

  try {
    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      'eng' // 'eng' stands for English
    );
    
    console.log("Extracted Text:", text);
    
    // Send the extracted text back to your website
    res.json({ extractedText: text });
    
  } catch (error) {
    console.error('Error during OCR:', error);
    res.status(500).json({ error: 'Failed to read image.' });
  }
});


// --- SECTION 6: Start Server (at the very end) ---
app.listen(port, () => {
  console.log('Server running at http://localhost:${port}');
});

app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"));

app.get("/",(req,res)=>{
    res.render("index.ejs");
})


app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.render("report.ejs");
});
app.get("/sign",(req,res)=>{
    res.render("signup.ejs");
})
app.get("/login",(req,res)=>{
    res.render("login.ejs");
})
app.get("/Contact", (req, res) => {
  res.render("Contact.ejs");
});
app.get("/send",(req,res)=>{
    res.render("send");
    send.ejs
});
app.listen(port,()=>{
    console.log(`server running at ${port}`);
})