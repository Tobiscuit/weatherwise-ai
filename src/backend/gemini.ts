import axios from 'axios';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

// This function is designed to be run directly, not as part of the main server.
// It is kept for reference and potential direct use.
export async function getWittyWeather(weatherData: any, lat: number, lon: number): Promise<string> {
  const GEMINI_API_KEY = process.env['GEMINI_API_KEY'];

  if (!GEMINI_API_KEY || GEMINI_API_KEY.length === 0) {
    throw new Error('Gemini API key is not set for direct use.');
  }

  const prompt = `You are a witty weather bot. Give a short, funny summary of the weather.
  Current weather: ${JSON.stringify(weatherData)}.
  Location: lat ${lat}, lon ${lon}.`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ?? 'No witty weather available.';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Error generating witty weather.';
  }
} 