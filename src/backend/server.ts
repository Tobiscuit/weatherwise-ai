import path from "path";
import formBody from "@fastify/formbody";
import staticFiles from "@fastify/static";
import axios from "axios";
import { fastify } from "fastify";
import nunjucks from "nunjucks";
import { z } from "zod";

import { config } from "./config";
import { GeminiService } from "./services/GeminiService";
import { LocationService } from "./services/LocationService";
import { WeatherService } from "./services/WeatherService";
import { weatherCodeToImage } from "./weather-codes";

// --- Service Initialization ---
const httpClient = axios;
const locationService = new LocationService(httpClient, config.GEOCODE_API_URL, config.GEOCODE_API_KEY);
const weatherService = new WeatherService(httpClient, config.WEATHER_API_URL);
// This is the only line that changes in this file:
const geminiService = new GeminiService();

// --- Fastify and Templating Setup ---
const environment = config.NODE_ENV;
const isProduction = environment === 'production';
const templatePath = isProduction
  ? path.join(__dirname, 'templates')
  : 'src/backend/templates';
const templates = new nunjucks.Environment(new nunjucks.FileSystemLoader(templatePath));

// --- Caching Setup ---
const cache = new Map<string, { html: string, timestamp: number }>();
const CACHE_DURATION = config.CACHE_DURATION_MS;
const MAX_CACHE_SIZE = config.MAX_CACHE_SIZE;

const server = fastify({
  logger: isProduction ? true : {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// --- Server Middleware and Routes ---
const locationSchema = z.object({
  location: z.string().min(1, 'Location cannot be empty.'),
});

function getCacheKey(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, '-');
}

function isCacheValid(key: string): boolean {
  if (!cache.has(key)) return false;
  const entry = cache.get(key);
  return entry !== undefined && (Date.now() - entry.timestamp) < CACHE_DURATION;
}

function cleanupCache(): void {
  if (cache.size > MAX_CACHE_SIZE) {
    const keys = Array.from(cache.keys());
    const keysToDelete = keys.slice(0, keys.length / 2);
    for (const key of keysToDelete) {
      cache.delete(key);
    }
  }
}

server.register(formBody);
server.register(staticFiles, {
  root: isProduction ? path.join(__dirname, 'static') : path.join(__dirname, 'static'),
  prefix: '/static/',
});

server.get("/", async (request, reply) => {
  const queryParams = request.query as Record<string, string>;
  
  if (typeof queryParams['location'] !== 'string' || queryParams['location'].length === 0) {
    const rendered = templates.render("get_started.njk", { environment });
    void reply.header("Content-Type", "text/html; charset=utf-8").send(rendered);
    return;
  }
  
  try {
    const { location } = locationSchema.parse(queryParams);
    
    const cacheKey = getCacheKey(location);
    if (isCacheValid(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (cachedData !== undefined) {
        void reply.header("Content-Type", "text/html; charset=utf-8").send(cachedData.html);
        return;
      }
    }
    
    cleanupCache();
    
    const locationInfo = await locationService.fetchLocation(location);
    const weatherInfo = await weatherService.fetchWeather(locationInfo);

    let wittyWeather = 'Unable to generate a witty weather summary.';
    try {
      // Your CurrentWeather model might be different, ensure it matches what GeminiService expects
      wittyWeather = await geminiService.generateWittySummary(weatherInfo, parseFloat(locationInfo.lat), parseFloat(locationInfo.lon));
    } catch (e: any) {
      server.log.error('Witty weather generation failed:', e.message);
      // Non-critical error, so we can continue without it.
    }
    
    const rendered = templates.render("weather.njk", {
      environment,
      location: locationInfo.display_name,
      currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      weather: {
        ...weatherInfo,
        conditionImg: weatherCodeToImage(weatherInfo.weathercode),
        condition: weatherInfo.condition(),
        lowTemp: weatherInfo.lowTemp(),
        highTemp: weatherInfo.highTemp(),
      },
      wittyWeather,
    });
    
    cache.set(cacheKey, { html: rendered, timestamp: Date.now() });
    
    void reply.header("Content-Type", "text/html; charset=utf-8").send(rendered);
    return;

  } catch (e: any) {
    server.log.error(e);
    const rendered = templates.render("get_started.njk", { environment, serverMsg: e.message });
    void reply.header("Content-Type", "text/html; charset=-8").status(500).send(rendered);
  }
});

const start = async (): Promise<void> => {
  try {
    const port = config.PORT;
    const host = isProduction ? '0.0.0.0' : config.HOST;
    await server.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();