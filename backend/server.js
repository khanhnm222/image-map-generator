// server.js
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5174', // Vite dev server
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Main generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { imageData, pitch, bearing, zoom, location } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    console.log('🎨 Generating visualization...');
    console.log(`📍 Location: ${location.lat}, ${location.lng}`);
    console.log(`📐 Camera: Pitch ${pitch}°, Bearing ${bearing}°, Zoom ${zoom}`);

    // Create highly detailed prompt for Gemini
    const prompt = `You are an expert architectural visualization AI. Transform this Mapbox satellite/map view into a PHOTOREALISTIC 3D architectural rendering.

SCENE CONTEXT:
- GPS Coordinates: ${location.lat}, ${location.lng}
- Camera Parameters: Pitch ${pitch}°, Bearing ${bearing}°, Zoom Level ${zoom}
- Perspective: ${pitch > 45 ? 'Aerial/Bird\'s eye view' : 'Street-level view'}

CRITICAL REQUIREMENTS:

🏢 ARCHITECTURE & BUILDINGS:
- Generate highly detailed, modern buildings with realistic proportions
- Materials: Glass curtain walls, concrete facades, steel structures, brick textures
- Details: Windows with reflections, balconies, rooftop equipment (HVAC, antennas)
- Building heights: Match typical urban density (mix of low-rise and high-rise)
- Architectural styles: Contemporary mixed-use buildings appropriate for urban area
- Lighting: Natural daylight with accurate shadow casting

🛣️ ROADS & INFRASTRUCTURE:
- Asphalt roads with realistic texture and wear patterns
- Clear lane markings (white/yellow lines)
- Road furniture: Traffic lights, street signs, lamp posts
- Crosswalks with zebra patterns
- Manholes and utility covers
- Proper road width and layout matching the map

🚶 URBAN LIFE & VEHICLES:
- Cars, buses, motorcycles realistically placed on roads (not floating)
- Vehicles appropriate for ${location.lat > 0 ? 'Northern' : 'Southern'} hemisphere
- Pedestrians walking on sidewalks (small, realistic scale)
- Parking areas with parked vehicles
- Active street life appropriate for ${getTimeOfDay()} time

🌳 VEGETATION & LANDSCAPING:
- Street trees with detailed foliage (species appropriate for climate)
- Parks with grass, pathways, benches
- Potted plants and urban greenery
- Seasonal vegetation (assume current season)
- Tree shadows on ground

💡 LIGHTING & ATMOSPHERE:
- Natural sunlight from realistic sun position
- Soft shadows with proper occlusion
- Atmospheric perspective (slight haze in distance)
- Reflections on glass and water surfaces
- Ambient light bounce between surfaces
- Sky with realistic clouds

🎯 TECHNICAL SPECIFICATIONS:
- Maintain EXACT camera angle: Pitch ${pitch}° and Bearing ${bearing}°
- Preserve geographical layout and street network
- 4K quality rendering
- Photorealistic materials with proper PBR properties
- Professional architectural visualization standard
- No cartoonish or artistic interpretation - pure photorealism

⚠️ AVOID:
- Floating objects or unrealistic placements
- Oversaturated colors
- Cartoon-like rendering
- Missing shadows
- Incorrect perspective
- Distorted proportions

OUTPUT FORMAT: Generate a single cohesive photorealistic image that looks like it was captured by a high-end drone camera or professional architectural photographer. The result should be indistinguishable from a real photograph.`;

    // Call Gemini Vision API with image
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-latest',
      generationConfig: {
        temperature: 0.4, // Lower for more consistent, realistic output
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    });
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: 'image/png'
        }
      }
    ]);

    const response = await result.response;
    const description = response.text();

    console.log('✅ Generation complete');

    // NOTE: Gemini Vision returns TEXT descriptions, not generated images
    // For actual image generation, you need to:
    // 1. Use Gemini's description + send to image generation API
    // 2. Or use direct image generation API like:
    //    - OpenAI DALL-E 3
    //    - Stability AI (Stable Diffusion)
    //    - Midjourney API
    //    - Replicate (various models)

    // For now, returning enhanced map image with AI description
    res.json({ 
      success: true, 
      image: `data:image/png;base64,${imageData}`,
      description: description,
      metadata: {
        location,
        camera: { pitch, bearing, zoom },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate image',
      details: error.stack
    });
  }
});

// Alternative endpoint using DALL-E 3 (if you have OpenAI API key)
app.post('/api/generate-dalle', async (req, res) => {
  try {
    const { imageData, pitch, bearing, zoom, location } = req.body;
    
    // This requires OpenAI API key
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Create a photorealistic 3D architectural visualization of an urban area at coordinates ${location.lat}, ${location.lng}. 
    Camera angle: ${pitch}° pitch, ${bearing}° bearing. 
    Include detailed buildings, roads, vehicles, trees, and urban life. 
    Style: Professional architectural rendering, 4K quality, natural lighting, realistic materials.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "natural"
    });

    res.json({
      success: true,
      image: response.data[0].url,
      description: prompt
    });

  } catch (error) {
    console.error('❌ DALL-E Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alternative endpoint using Stable Diffusion via Replicate
app.post('/api/generate-sd', async (req, res) => {
  try {
    const { imageData, pitch, bearing, zoom, location } = req.body;
    
    const Replicate = require('replicate');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });

    const prompt = `Professional architectural visualization, photorealistic 3D render of urban cityscape, 
    detailed modern buildings, realistic materials (glass, concrete, steel), 
    street-level view with cars and pedestrians, natural lighting, shadows, 
    4K quality, architectural photography style, sharp details`;

    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: "cartoon, anime, drawing, sketch, low quality, blurry, distorted",
          width: 1024,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      }
    );

    res.json({
      success: true,
      image: output[0],
      description: prompt
    });

  } catch (error) {
    console.error('❌ Stable Diffusion Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI Map Visualizer Server',
    version: '1.0.0',
    endpoints: {
      generate: '/api/generate (Gemini Vision - returns description)',
      dalle: '/api/generate-dalle (DALL-E 3 - requires OpenAI key)',
      sd: '/api/generate-sd (Stable Diffusion - requires Replicate key)'
    }
  });
});

// Helper function
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 20) return 'evening';
  return 'night';
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   AI Map Visualizer Server`);
  console.log('   ========================================');
  console.log(`   🌐 Server: http://localhost:${PORT}`);
  console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
  console.log(`   🎨 Generate: POST http://localhost:${PORT}/api/generate`);
  console.log('   ========================================\n');
  console.log('   📝 API Keys needed:');
  console.log('   - GEMINI_API_KEY (required)');
  console.log('   - OPENAI_API_KEY (optional - for DALL-E)');
  console.log('   - REPLICATE_API_TOKEN (optional - for SD)');
  console.log('   ========================================\n');
});