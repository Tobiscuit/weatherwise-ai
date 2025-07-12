import axios from 'axios';

// Cloud Run function URL (will be set after deployment)
const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL !== undefined && process.env.CLOUD_RUN_URL !== '' 
  ? process.env.CLOUD_RUN_URL 
  : 'https://weather-gemini-xxxxx-uc.a.run.app';

interface WeatherData {
  temperature?: {
    value: number;
    unit: string;
  };
  condition?: () => string;
  highTemp?: () => number;
  lowTemp?: () => number;
}

interface CloudRunResponse {
  wittyWeather: string;
  timestamp: string;
  region: string;
}

export async function getWittyWeatherFromCloudRun(
  weatherData: WeatherData, 
  lat?: string, 
  lon?: string
): Promise<string> {
  try {
    const response = await axios.post(
      `${CLOUD_RUN_URL}/generateWeather`,
      {
        weatherData: {
          temperature: weatherData.temperature,
          condition: weatherData.condition?.(),
          highTemp: weatherData.highTemp?.(),
          lowTemp: weatherData.lowTemp?.(),
        },
        lat,
        lon
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 seconds for Cloud Run
      }
    );
    
    const data = response.data as CloudRunResponse;
    return data.wittyWeather;
    
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

// Warm up the Cloud Run function
export async function warmupCloudRun(): Promise<void> {
  try {
    await axios.get(`${CLOUD_RUN_URL}/warmup`, {
      timeout: 5000
    });
    console.log('✅ Cloud Run function warmed up');
  } catch (error) {
    console.log('⚠️ Could not warm up Cloud Run function:', error);
  }
} 