import axios from 'axios';

// Cloud Run function URL (will be set after deployment)
const CLOUD_RUN_URL = process.env['CLOUD_RUN_URL'] ?? '';

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
  lat?: number, 
  lon?: number
): Promise<string> {
  if (CLOUD_RUN_URL === '') {
    return 'Cloud Run URL not configured.';
  }

  try {
    const response = await axios.post<CloudRunResponse>(
      CLOUD_RUN_URL,
      { weatherData, lat, lon },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds
      }
    );
    return response.data.wittyWeather;
  } catch (error) {
    console.error('Error fetching witty weather:', error);
    return 'Unable to get a witty weather summary right now.';
  }
}

export async function warmupCloudRun(): Promise<void> {
  if (CLOUD_RUN_URL === '') {
    return;
  }
  
  try {
    await axios.get(`${CLOUD_RUN_URL}/warmup`, { timeout: 1000 });
  } catch (error) {
    // Silently fail
  }
} 