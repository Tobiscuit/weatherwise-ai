import { z } from "zod";
import { weatherCodes } from "./weather-codes";


export const WeatherDataSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
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
  }),
  // These are now optional as they are not always present
  daily_units: z.object({
    weathercode: z.string(),
    temperature_2m_max: z.string(),
    temperature_2m_min: z.string(),
  }).optional(),
  daily: z.object({
    weathercode: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
  }).optional(),
});

export type WeatherData = z.infer<typeof WeatherDataSchema>;

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

  constructor(apiResponse: WeatherData) {
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

