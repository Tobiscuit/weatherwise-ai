import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';

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

  // Create a plain data object, calling the functions
  const plainWeatherData = {
    temperature: weatherData.temperature,
    condition: (weatherData.condition !== undefined) ? weatherData.condition() : 'Unknown',
    highTemp: (weatherData.highTemp !== undefined) ? weatherData.highTemp() : undefined,
    lowTemp: (weatherData.lowTemp !== undefined) ? weatherData.lowTemp() : undefined,
  };

  try {
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(CLOUD_RUN_URL);
    
    const response = await client.request<CloudRunResponse>({
      url: CLOUD_RUN_URL,
      method: 'POST',
      data: { weatherData: plainWeatherData, lat, lon },
      timeout: 10000,
    });
    
    return response.data.wittyWeather;
  } catch (error) {
    console.error('Error fetching witty weather:', JSON.stringify(error, null, 2));
    return 'Unable to get a witty weather summary right now.';
  }
}

export async function warmupCloudRun(): Promise<void> {
  if (CLOUD_RUN_URL === '') {
    return;
  }
  
  try {
    // Warmup does not need to be authenticated
    const auth = new GoogleAuth();
    const client = await auth.getClient();
    await client.request({ url: `${CLOUD_RUN_URL}/warmup`, timeout: 1000 });
  } catch (error) {
    // Silently fail
  }
} 