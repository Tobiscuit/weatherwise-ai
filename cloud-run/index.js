const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize the GoogleGenerativeAI client without an API key.
// When deployed on Google Cloud, the library will automatically use the
// service account credentials of the Cloud Run service.
// For local development, it will use the credentials from `gcloud auth application-default login`.
const genAI = new GoogleGenerativeAI();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'WeatherWise AI Cloud Run',
    timestamp: new Date().toISOString()
  });
});

// Main Gemini API endpoint
app.post('/generate-weather-summary', async (req, res) => {
  try {
    const { weatherData, lat, lon } = req.body;
    
    if (!weatherData) {
      return res.status(400).json({ error: 'Weather data is required' });
    }

    // Calculate local time based on coordinates
    const localTime = new Date();
    if (lat && lon) {
      // Simple timezone estimation based on longitude
      const timezoneOffset = Math.round(lon / 15) * 60; // 15 degrees = 1 hour
      localTime.setMinutes(localTime.getMinutes() + timezoneOffset);
    }

    const prompt = `You are Nimbus, a cheerful cloud mascot for a weather app. Generate a witty, engaging 2-3 sentence weather summary for ${weatherData.location || 'this location'}.

Current weather data:
- Temperature: ${weatherData.temperature}°${weatherData.temperature_unit || 'C'}
- Condition: ${weatherData.condition}
- High: ${weatherData.highTemp()}°${weatherData.temperature_unit || 'C'}
- Low: ${weatherData.lowTemp()}°${weatherData.temperature_unit || 'C'}
- Local time: ${localTime.toLocaleString()}

Write a fun, personality-driven summary that makes weather checking enjoyable. Be conversational and include a weather-related joke or observation. Keep it under 150 words.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      summary: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      error: 'Unable to generate weather summary',
      details: error.message 
    });
  }
});

// Warm-up endpoint
app.get('/warmup', (req, res) => {
  res.json({ 
    status: 'warmed up',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`WeatherWise AI Cloud Run function listening on port ${port}`);
}); 