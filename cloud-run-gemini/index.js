const { default: axios } = require('axios');
const { GoogleAuth } = require('google-auth-library');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
const REQUEST_TIMEOUT = 8000;

// Initialize Google Auth
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});


function getLocationTime(lat, lon) {
  try {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const longitude = parseFloat(lon);
    const estimatedOffset = Math.round(longitude / 15) * 60;
    const locationTime = new Date(utcTime + (estimatedOffset * 60000));
    
    return {
      time: locationTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      date: locationTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    };
  } catch (error) {
    const now = new Date();
    return {
      time: now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      date: now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    };
  }
}

async function generateWittyWeather(weatherData, lat, lon) {
  let currentTime = '';
  let currentDate = '';
  
  if (lat && lon) {
    const locationTime = getLocationTime(lat, lon);
    currentTime = locationTime.time;
    currentDate = locationTime.date;
  } else {
    const now = new Date();
    currentTime = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    currentDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  const prompt = `You are Nimbus, a friendly cloud mascot who loves talking about weather! Write a brief, witty paragraph about the current weather as if you're chatting with a friend. The current local time at this location is ${currentTime} on ${currentDate}. 

Weather data: Temperature ${weatherData.temperature?.value}${weatherData.temperature?.unit}, Condition: ${weatherData.condition}, High: ${weatherData.highTemp}${weatherData.temperature?.unit}, Low: ${weatherData.lowTemp}${weatherData.temperature?.unit}.

Be cheerful, use weather puns if appropriate, and make it feel like a friendly conversation. Use the current local time I provided, not any time from the weather data.`;
  
  try {
    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;
    
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: REQUEST_TIMEOUT
      }
    );
    
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text && text.length > 0) {
      return text;
    } else {
      return 'No witty weather available.';
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return 'Weather AI is taking too long to respond. Please try again!';
      }
      if (error.response?.status === 429) {
        return 'Weather AI is a bit busy right now. Please try again in a moment!';
      }
    }
    return 'Unable to generate a witty weather summary at this time.';
  }
}

// Main endpoint for generating weather summaries
app.post('/', async (req, res) => {
  try {
    const { weatherData, lat, lon } = req.body;
    
    if (!weatherData) {
      return res.status(400).json({ error: 'Weather data is required' });
    }
    
    const wittyWeather = await generateWittyWeather(weatherData, lat, lon);
    
    res.status(200).json({ 
      wittyWeather,
      timestamp: new Date().toISOString(),
      region: 'us-south1'
    });
    
  } catch (error) {
    console.error('Error generating weather:', error);
    res.status(500).json({ 
      error: 'Failed to generate weather summary',
      wittyWeather: 'Unable to generate a witty weather summary at this time.'
    });
  }
});

// Warm-up endpoint
app.get('/warmup', async (req, res) => {
  res.status(200).json({ 
    status: 'warmed up',
    timestamp: new Date().toISOString(),
    region: 'us-south1'
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Weather Gemini service listening on port ${port}`);
}); 