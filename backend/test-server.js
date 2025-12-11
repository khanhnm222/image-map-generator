// simple-server.js - Version without AI, just returns the map image
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple generation endpoint - just returns the image
app.post('/api/generate', async (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('📨 NEW REQUEST to /api/generate');
  console.log('='.repeat(60));
  
  try {
    const { imageData, pitch, bearing, zoom, location } = req.body;

    // Detailed logging
    console.log('📦 Request body structure:');
    console.log('  - imageData:', imageData ? `${imageData.length} chars` : '❌ MISSING');
    console.log('  - pitch:', pitch);
    console.log('  - bearing:', bearing);
    console.log('  - zoom:', zoom);
    console.log('  - location:', location);

    // Validation
    if (!imageData) {
      console.error('❌ VALIDATION FAILED: No image data');
      return res.status(400).json({ 
        error: 'No image data provided',
        received: Object.keys(req.body)
      });
    }

    if (!location || typeof location.lat === 'undefined' || typeof location.lng === 'undefined') {
      console.error('❌ VALIDATION FAILED: Invalid location');
      return res.status(400).json({ 
        error: 'Invalid location data',
        received: location
      });
    }

    console.log('✅ Validation passed');
    console.log(`📍 Location: ${location.lat}, ${location.lng}`);
    console.log(`📐 Camera: Pitch ${pitch}°, Bearing ${bearing}°, Zoom ${zoom}`);
    
    // Calculate image size
    const sizeInBytes = imageData.length * 0.75;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    console.log(`📊 Image size: ~${sizeInMB} MB`);

    // Simulate AI processing time
    console.log('⏳ Processing... (simulated 1s delay)');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a fun description based on location
    const descriptions = [
      `Captured stunning aerial view of urban landscape at ${location.lat.toFixed(4)}°N, ${location.lng.toFixed(4)}°E`,
      `Beautiful ${pitch > 60 ? 'bird\'s eye' : 'street-level'} perspective of the cityscape`,
      `Map view rendered with ${bearing}° rotation, showing intricate urban details`,
      `High-definition capture at zoom level ${zoom}, revealing architectural patterns`,
      `Photographic simulation of urban environment with ${pitch}° pitch angle`
    ];
    
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];

    const response = {
      success: true,
      image: `data:image/png;base64,${imageData}`,
      description: randomDescription + '\n\n⚠️ Note: This is the original map image. To get AI-generated 3D visualization, you need to configure Gemini API or use another AI service.',
      metadata: {
        location,
        camera: { pitch, bearing, zoom },
        imageSize: `${sizeInMB} MB`,
        timestamp: new Date().toISOString(),
        note: 'No AI processing - original map returned'
      }
    };

    console.log('✅ Response prepared');
    console.log('📤 Sending response...');
    console.log('='.repeat(60) + '\n');
    
    res.json(response);

  } catch (error) {
    console.error('❌ SERVER ERROR:', error);
    console.error('Stack:', error.stack);
    console.log('='.repeat(60) + '\n');
    
    res.status(500).json({ 
      error: error.message || 'Failed to process request',
      details: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🚀 Simple Map Visualizer Server (No AI)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: '✅ Server is working!',
    endpoints: {
      health: '/health',
      generate: 'POST /api/generate',
      test: '/test'
    },
    timestamp: new Date().toISOString()
  });
});

// Endpoint to test CORS
app.options('/api/generate', cors());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /test', 
      'POST /api/generate'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log('\n' + '🚀 '.repeat(30));
  console.log('   Simple Map Visualizer Server (No AI)');
  console.log('🚀 '.repeat(30));
  console.log(`\n   🌐 Server: http://localhost:${PORT}`);
  console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
  console.log(`   🧪 Test:   http://localhost:${PORT}/test`);
  console.log(`   🎨 API:    POST http://localhost:${PORT}/api/generate`);
  console.log('\n' + '='.repeat(60));
  console.log('   ⚠️  NOTE: This version does NOT use AI');
  console.log('   It simply returns the map image back to test integration');
  console.log('='.repeat(60));
  console.log('\n✅ Server ready! Waiting for requests...\n');
});