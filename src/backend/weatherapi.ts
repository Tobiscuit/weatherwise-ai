import { it } from "node:test";
import { z } from "zod";
import type { AxiosStatic } from "axios";

const weatherCodes: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Moderate thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

// Improved US location detection
function shouldUseFahrenheit(displayName: string): boolean {
  const lowerName = displayName.toLowerCase();
  // More specific patterns to avoid false positives
  return lowerName.includes(', us') || 
         lowerName.includes(', usa') || 
         lowerName.includes('united states,') ||
         lowerName.includes('usa,') ||
         lowerName.includes('us,') ||
         lowerName.endsWith(', us') ||
         lowerName.endsWith(', usa');
}

export const currentWeatherApiResponseSchema = z.object({
  current_weather: z.object({
    temperature: z.number(),
    windspeed: z.number(),
    winddirection: z.number(),
    weathercode: z.number(),
    is_day: z.number(),
    time: z.string(),
  }),
  hourly_units: z.object({
    temperature_2m: z.string(),
  }),
  hourly: z.object({
    temperature_2m: z.array(z.number()),
  })
});

export type CurrentWeatherApiResponse = z.infer<typeof currentWeatherApiResponseSchema>;

export interface Temperature {
  value: number;
  unit: string;
}
export interface Wind {
  speed: number;
  direction: number;
  unit: string;
}

export class CurrentWeather {
  temperature: Temperature;
  weathercode: number;
  is_day: boolean;
  time: string;
  hourlyTemp: number[];

  constructor(apiResponse: CurrentWeatherApiResponse) {
    this.temperature = {
      value: apiResponse.current_weather.temperature,
      unit: apiResponse.hourly_units.temperature_2m,
    };
    this.weathercode = apiResponse.current_weather.weathercode;
    this.is_day = apiResponse.current_weather.is_day === 1;
    this.time = apiResponse.current_weather.time;
    this.hourlyTemp = apiResponse.hourly.temperature_2m;
  }

  lowTemp(): number {
    return this.hourlyTemp.reduce((a, b) => Math.min(a, b));
  }

  highTemp(): number {
    return this.hourlyTemp.reduce((a, b) => Math.max(a, b));
  }

  condition(): string {
    return weatherCodes[this.weathercode] ?? 'Unknown';
  }
}

export async function fetchWeatherData(
  axios: AxiosStatic,
  apiUrl: string,
  lat: string,
  lon: string,
  displayName: string
): Promise<CurrentWeather> {
  const useFahrenheit = shouldUseFahrenheit(displayName);
  
  const options = {
    method: "GET",
    url: apiUrl,
    params: {
      latitude: lat,
      longitude: lon,
      hourly: "temperature_2m",
      temperature_unit: useFahrenheit ? "fahrenheit" : "celsius",
      current_weather: true,
      forecast_days: 1,
    },
    timeout: 5000, // 5 second timeout
  };

  const response = await axios.request(options);

  if (response.status === 200) {
    try {
      const res = currentWeatherApiResponseSchema.parse(response.data);
      return new CurrentWeather(res);
    } catch (e) {
      throw new Error("Received invalid API response");
    }
  } else {
    throw new Error("Failed to fetch weather data");
  }
}

