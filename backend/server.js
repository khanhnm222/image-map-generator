import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('📨 Received request to /api/generate');
    console.log('='.repeat(60));
    console.log('Request body keys:', Object.keys(req.body));
    
    const { imageData, pitch, bearing, zoom, location } = req.body;

    // Validation
    if (!imageData) {
      console.error('❌ No image data provided');
      return res.status(400).json({ error: 'No image data provided' });
    }

    if (!location || !location.lat || !location.lng) {
      console.error('❌ Invalid location data');
      return res.status(400).json({ error: 'Invalid location data' });
    }

    // Check image size
    const sizeInBytes = imageData.length * 0.75;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    console.log(`📊 Image size: ~${sizeInMB} MB`);

    if (sizeInMB > 15) {
      console.warn('⚠️  Image too large for Gemini (>15MB)');
      return res.status(400).json({ 
        error: 'Image too large. Please zoom out or reduce resolution.',
        size: `${sizeInMB} MB`,
        limit: '15 MB'
      });
    }

    console.log('✅ Validation passed');
    console.log(`📍 Location: ${location.lat}, ${location.lng}`);
    console.log(`📐 Camera: Pitch ${pitch}°, Bearing ${bearing}°, Zoom ${zoom}`);

    const prompt = `Transform this Mapbox map view into a PHOTOREALISTIC 3D architectural visualization.

SCENE CONTEXT:
- GPS: ${location.lat}, ${location.lng}
- Camera: Pitch ${pitch}°, Bearing ${bearing}°, Zoom ${zoom}

REQUIREMENTS:
🏢 ARCHITECTURE:
- Detailed modern buildings with realistic materials (glass, concrete, steel)
- Windows, balconies, rooftop details
- Proper building heights and proportions
- Natural lighting with accurate shadows

🛣️ INFRASTRUCTURE:
- Asphalt roads with lane markings
- Sidewalks, crosswalks
- Street lights, traffic signs
- Proper road layout matching the map

🚗 URBAN LIFE:
- Cars, motorcycles on roads
- Pedestrians on sidewalks
- Parking areas with vehicles
- Active street life

🌳 VEGETATION:
- Street trees with detailed foliage
- Parks and green spaces
- Urban landscaping

💡 LIGHTING & ATMOSPHERE:
- Natural daylight
- Soft shadows
- Reflections on glass
- Atmospheric haze

TECHNICAL:
- Maintain exact camera angle (pitch ${pitch}°, bearing ${bearing}°)
- Preserve geographical layout
- 4K quality, photorealistic rendering
- Professional architectural visualization standard

OUTPUT: Single photorealistic image that looks like a real photograph.`;

    console.log('🤖 Calling Gemini API...');
    
    // Use gemini-1.5-flash for better stability and lower cost
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
    });
    
    try {
      // ✅ CORRECT FORMAT: Image first, then text
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: 'image/png',
        },
      };

      const textPart = {
        text: prompt
      };

      const result = await model.generateContent([imagePart, textPart]);

      if (!result || !result.response) {
        throw new Error('No response from Gemini API');
      }

      const response = result.response;
      const description = response.text();

      console.log('✅ Gemini API success');
      console.log(`📝 Description length: ${description.length} chars`);
      console.log('='.repeat(60) + '\n');

      // Return original image with AI description
      res.json({ 
        success: true, 
        image: `data:image/png;base64,${imageData}`,
        description: description,
        metadata: {
          location,
          camera: { pitch, bearing, zoom },
          imageSize: `${sizeInMB} MB`,
          model: 'gemini-1.5-flash',
          timestamp: new Date().toISOString()
        }
      });

    } catch (geminiError) {
      console.error('❌ Gemini API Error:');
      console.error('Status:', geminiError.status);
      console.error('Message:', geminiError.message);
      
      // Log detailed error information
      if (geminiError.errorDetails) {
        console.error('Error Details:', JSON.stringify(geminiError.errorDetails, null, 2));
        
        // Extract field violations if present
        geminiError.errorDetails.forEach(detail => {
          if (detail.fieldViolations) {
            console.error('Field Violations:');
            detail.fieldViolations.forEach(v => {
              console.error(`  - Field: ${v.field}`);
              console.error(`    Description: ${v.description}`);
            });
          }
        });
      }
      
      console.log('='.repeat(60) + '\n');
      
      // Return image with error information
      return res.json({ 
        success: false,
        image: `data:image/png;base64,${imageData}`,
        description: `⚠️ AI generation failed: ${geminiError.message}\n\nReturning original map image.`,
        error: {
          message: geminiError.message,
          status: geminiError.status,
          details: geminiError.errorDetails
        },
        metadata: {
          location,
          camera: { pitch, bearing, zoom },
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('❌ Server Error:', error);
    console.error('Stack:', error.stack);
    console.log('='.repeat(60) + '\n');
    
    res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      stack: error.stack
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI Map Visualizer Server',
    version: '1.0.0',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify Gemini API
app.get('/test-gemini', async (req, res) => {
  try {
    console.log('🧪 Testing Gemini API...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello in one word');
    const text = result.response.text();
    
    res.json({
      success: true,
      message: 'Gemini API is working!',
      response: text
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.errorDetails
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log('\n' + '🚀 '.repeat(30));
  console.log('   AI Map Visualizer Server');
  console.log('🚀 '.repeat(30));
  console.log(`\n   🌐 Server: http://localhost:${PORT}`);
  console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
  console.log(`   🧪 Test Gemini: http://localhost:${PORT}/test-gemini`);
  console.log(`   🎨 API: POST http://localhost:${PORT}/api/generate`);
  console.log('\n' + '='.repeat(60));
  console.log('   API Keys:');
  console.log(`   - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log('='.repeat(60));
  console.log('\n✅ Server ready! Waiting for requests...\n');
});