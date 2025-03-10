const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Create output directory for processed files
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Helper function to run ImageMagick commands
function runImageMagick(command, inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const fullCommand = `convert ${inputPath} ${command} ${outputPath}`;
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`ImageMagick error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.warn(`ImageMagick warning: ${stderr}`);
      }
      resolve(outputPath);
    });
  });
}

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ImageMagick API is running' });
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    fileId: path.basename(req.file.path),
    originalName: req.file.originalname
  });
});

// Resize image
app.post('/resize', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const width = req.query.width || 800;
    const height = req.query.height || 600;
    const maintainAspectRatio = req.query.maintain !== 'false';
    
    const inputPath = req.file.path;
    const outputFileName = `${Date.now()}-resized.jpg`;
    const outputPath = path.join(outputDir, outputFileName);
    
    const resizeOption = maintainAspectRatio ? `-resize ${width}x${height}` : `-resize ${width}x${height}!`;
    
    await runImageMagick(resizeOption, inputPath, outputPath);
    
    res.json({
      message: 'Image resized successfully',
      fileId: outputFileName,
      downloadUrl: `/download/${outputFileName}`
    });
    
    // Clean up input file
    fs.unlinkSync(inputPath);
    
  } catch (error) {
    res.status(500).json({ error: 'Resize operation failed', details: error.message });
  }
});

// Convert format
app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const format = req.query.format || 'png';
    
    const inputPath = req.file.path;
    const outputFileName = `${Date.now()}-converted.${format}`;
    const outputPath = path.join(outputDir, outputFileName);
    
    await runImageMagick('', inputPath, outputPath);
    
    res.json({
      message: `Image converted to ${format} successfully`,
      fileId: outputFileName,
      downloadUrl: `/download/${outputFileName}`
    });
    
    // Clean up input file
    fs.unlinkSync(inputPath);
    
  } catch (error) {
    res.status(500).json({ error: 'Format conversion failed', details: error.message });
  }
});

// Apply filter/effect
app.post('/filter', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const filter = req.query.filter || 'grayscale';
    
    const inputPath = req.file.path;
    const outputFileName = `${Date.now()}-filtered.jpg`;
    const outputPath = path.join(outputDir, outputFileName);
    
    let filterCommand = '';
    
    switch (filter) {
      case 'grayscale':
        filterCommand = '-colorspace Gray';
        break;
      case 'sepia':
        filterCommand = '-sepia-tone 80%';
        break;
      case 'blur':
        const amount = req.query.amount || 5;
        filterCommand = `-blur 0x${amount}`;
        break;
      case 'sharpen':
        filterCommand = '-sharpen 0x3';
        break;
      case 'edge':
        filterCommand = '-edge 1';
        break;
      case 'negate':
        filterCommand = '-negate';
        break;
      case 'charcoal':
        filterCommand = '-charcoal 2';
        break;
      default:
        filterCommand = '-colorspace Gray'; // Default to grayscale
    }
    
    await runImageMagick(filterCommand, inputPath, outputPath);
    
    res.json({
      message: 'Filter applied successfully',
      filter: filter,
      fileId: outputFileName,
      downloadUrl: `/download/${outputFileName}`
    });
    
    // Clean up input file
    fs.unlinkSync(inputPath);
    
  } catch (error) {
    res.status(500).json({ error: 'Filter application failed', details: error.message });
  }
});

// Crop image
app.post('/crop', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const width = req.query.width || 300;
    const height = req.query.height || 300;
    const x = req.query.x || 0;
    const y = req.query.y || 0;
    
    const inputPath = req.file.path;
    const outputFileName = `${Date.now()}-cropped.jpg`;
    const outputPath = path.join(outputDir, outputFileName);
    
    await runImageMagick(`-crop ${width}x${height}+${x}+${y}`, inputPath, outputPath);
    
    res.json({
      message: 'Image cropped successfully',
      fileId: outputFileName,
      downloadUrl: `/download/${outputFileName}`
    });
    
    // Clean up input file
    fs.unlinkSync(inputPath);
    
  } catch (error) {
    res.status(500).json({ error: 'Crop operation failed', details: error.message });
  }
});

// Add text to image
app.post('/text', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const text = req.query.text || 'Watermark';
    const color = req.query.color || 'white';
    const size = req.query.size || 24;
    const x = req.query.x || 'center';
    const y = req.query.y || 'center';
    
    const inputPath = req.file.path;
    const outputFileName = `${Date.now()}-text.jpg`;
    const outputPath = path.join(outputDir, outputFileName);
    
    await runImageMagick(`-fill ${color} -pointsize ${size} -gravity ${x} -annotate +0+${y} "${text}"`, inputPath, outputPath);
    
    res.json({
      message: 'Text added successfully',
      fileId: outputFileName,
      downloadUrl: `/download/${outputFileName}`
    });
    
    // Clean up input file
    fs.unlinkSync(inputPath);
    
  } catch (error) {
    res.status(500).json({ error: 'Text addition failed', details: error.message });
  }
});

// Rotate image
app.post('/rotate', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const degrees = req.query.degrees || 90;
    
    const inputPath = req.file.path;
    const outputFileName = `${Date.now()}-rotated.jpg`;
    const outputPath = path.join(outputDir, outputFileName);
    
    await runImageMagick(`-rotate ${degrees}`, inputPath, outputPath);
    
    res.json({
      message: 'Image rotated successfully',
      fileId: outputFileName,
      downloadUrl: `/download/${outputFileName}`
    });
    
    // Clean up input file
    fs.unlinkSync(inputPath);
    
  } catch (error) {
    res.status(500).json({ error: 'Rotation failed', details: error.message });
  }
});

// Download processed file
app.get('/download/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const filePath = path.join(outputDir, fileId);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start the server
app.listen(port, () => {
  console.log(`ImageMagick API running on port ${port}`);
});

// Clean up temporary files periodically (every hour)
setInterval(() => {
  const uploadDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadDir);
  
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  files.forEach(file => {
    const filePath = path.join(uploadDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.ctimeMs < oneHourAgo) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up: ${filePath}`);
    }
  });
  
  // Also clean up output directory
  const outputFiles = fs.readdirSync(outputDir);
  outputFiles.forEach(file => {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.ctimeMs < oneHourAgo) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up: ${filePath}`);
    }
  });
}, 60 * 60 * 1000);
