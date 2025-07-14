import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8089),
  HOST: z.string().default('127.0.0.1'),
  WEATHER_API_URL: z.string().url().default('https://api.open-meteo.com/v1/forecast'),
  GEOCODE_API_URL: z.string().url().default('https://geocode.maps.co/search'),
  GEOCODE_API_KEY: z.string().optional(),
  CACHE_DURATION_MS: z.coerce.number().default(5 * 60 * 1000), // 5 minutes
  MAX_CACHE_SIZE: z.coerce.number().default(100),
});

type AppConfig = z.infer<typeof configSchema>;

function createConfig(): AppConfig {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables.');
  }
  return result.data;
}

export const config = createConfig(); 