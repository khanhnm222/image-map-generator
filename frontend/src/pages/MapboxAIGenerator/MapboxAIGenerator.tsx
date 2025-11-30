import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, MapPin, Download, Maximize2 } from 'lucide-react';
import mapboxgl from "mapbox-gl";

const MapboxAIGenerator = () => {
  const mapContainer = useRef<any>(null);
  const map = useRef<any>(null);
  const [lng, setLng] = useState(105.8342);
  const [lat, setLat] = useState(21.0278);
  const [zoom, setZoom] = useState(15);
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load Mapbox GL JS
  useEffect(() => {
    const loadMapbox = () => {
      // Load CSS
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.async = true;
      script.onload = () => setMapboxLoaded(true);
      document.head.appendChild(script);
    };

    loadMapbox();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxLoaded || map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      antialias: true
    });

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
      setPitch(map.current.getPitch().toFixed(0));
      setBearing(map.current.getBearing().toFixed(0));
    });

    // Add 3D buildings
    map.current.on('load', () => {
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer: any) => layer.type === 'symbol' && layer.layout['text-field']
      ).id;

      map.current.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );
    });
  }, [mapboxLoaded]);

  const captureMapCanvas = () => {
    if (!map.current) return null;
    const canvas = map.current.getCanvas();
    return canvas.toDataURL('image/png');
  };

  const generateImage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Capture map canvas
      const mapImage = captureMapCanvas();
      if (!mapImage) {
        throw new Error('Không thể capture bản đồ');
      }

      // Prepare prompt
      const prompt = `Transform this map view into a highly realistic, photorealistic 3D architectural visualization. 
      
Key requirements:
- Create detailed, modern buildings with realistic textures (glass, concrete, steel)
- Add realistic lighting with natural shadows and reflections
- Include environmental details: trees, streetlights, cars, people
- Maintain the exact geographical layout and positioning from the map
- Use perspective matching the camera angle (pitch: ${pitch}°, bearing: ${bearing}°)
- Add atmospheric effects like ambient occlusion and depth of field
- Ensure professional architectural rendering quality
- Include details like windows, balconies, rooftops, and building materials
- Add urban elements: roads, sidewalks, traffic signs, vegetation

Style: Professional architectural visualization, hyperrealistic, high detail, natural lighting, 4K quality`;

      // Call API (Demo - bạn cần implement backend thực tế)
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: mapImage,     // ✅ Backend expects this
          pitch: Number(pitch),       // ✅ Backend expects this
          bearing: Number(bearing),   // ✅ Backend expects this
          zoom: Number(zoom),         // ✅ Backend expects this
          location: { lat, lng }      // ✅ Backend expects this
        })
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data = await response.json();

      console.log('image data', data);
      
      // Demo: Sử dụng map image làm placeholder  
      // Trong production, bạn sẽ nhận được generated image từ API
      setGeneratedImage(mapImage);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `map-render-${Date.now()}.png`;
    link.click();
  };

  const adjustCamera = (type: any) => {
    if (!map.current) return;
    
    switch(type) {
      case 'pitch-up':
        map.current.setPitch(Math.min(85, pitch + 10));
        break;
      case 'pitch-down':
        map.current.setPitch(Math.max(0, pitch - 10));
        break;
      case 'rotate-left':
        map.current.setBearing(bearing - 30);
        break;
      case 'rotate-right':
        map.current.setBearing(bearing + 30);
        break;
      case 'reset':
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          pitch: 60,
          bearing: 0
        });
        break;
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">AI Map Visualizer</h1>
              <p className="text-blue-100 text-sm">Chuyển đổi bản đồ thành hình ảnh 3D chân thực</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-white text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{lat}, {lng}</span>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded">
              Zoom: {zoom}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Map Panel */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden flex-1 relative">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Map Info Overlay */}
            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm">
              <div className="flex flex-col gap-1">
                <div>Pitch: {pitch}° | Bearing: {bearing}°</div>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              <button
                onClick={() => adjustCamera('pitch-up')}
                className="bg-white/90 hover:bg-white p-2 rounded shadow-lg transition"
                title="Tăng pitch"
              >
                ▲
              </button>
              <button
                onClick={() => adjustCamera('rotate-left')}
                className="bg-white/90 hover:bg-white p-2 rounded shadow-lg transition"
                title="Xoay trái"
              >
                ◄
              </button>
              <button
                onClick={() => adjustCamera('reset')}
                className="bg-white/90 hover:bg-white p-2 rounded shadow-lg transition"
                title="Reset camera"
              >
                ●
              </button>
              <button
                onClick={() => adjustCamera('rotate-right')}
                className="bg-white/90 hover:bg-white p-2 rounded shadow-lg transition"
                title="Xoay phải"
              >
                ►
              </button>
              <button
                onClick={() => adjustCamera('pitch-down')}
                className="bg-white/90 hover:bg-white p-2 rounded shadow-lg transition"
                title="Giảm pitch"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateImage}
            disabled={loading || !mapboxLoaded}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Đang tạo hình ảnh...
              </>
            ) : (
              <>
                <Camera className="w-6 h-6" />
                Generate 3D Visualization
              </>
            )}
          </button>
        </div>

        {/* Result Panel */}
        <div className="w-1/2 bg-gray-800 rounded-lg shadow-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Maximize2 className="w-5 h-5" />
              Kết quả AI
            </h2>
            {generatedImage && (
              <button
                onClick={downloadImage}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </button>
            )}
          </div>

          <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            {error ? (
              <div className="text-red-400 text-center p-8">
                <p className="text-lg font-semibold mb-2">Lỗi:</p>
                <p>{error}</p>
                <p className="text-sm mt-4 text-gray-400">
                  Lưu ý: Demo này cần backend API để kết nối với Gemini Vision.
                  <br />Vui lòng xem hướng dẫn setup bên dưới.
                </p>
              </div>
            ) : generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated visualization"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-center p-8">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Chưa có hình ảnh</p>
                <p className="text-sm mt-2">Điều chỉnh bản đồ và nhấn Generate</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 bg-gray-900 rounded-lg p-4 text-sm text-gray-300">
            <h3 className="font-semibold text-white mb-2">📋 Hướng dẫn:</h3>
            <ul className="space-y-1">
              <li>1. Di chuyển và zoom bản đồ đến vị trí mong muốn</li>
              <li>2. Dùng các nút điều khiển để xoay camera</li>
              <li>3. Nhấn "Generate" để tạo hình ảnh 3D</li>
              <li>4. Token Mapbox: <span className="text-yellow-400">Cần thay thế trong code</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapboxAIGenerator;