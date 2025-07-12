import path from "path";
import formBody from "@fastify/formbody";
import staticFiles from "@fastify/static";
import axios from "axios";
import dotenv from "dotenv";
import { fastify as fastify_fastify } from "fastify";
import nunjucks from "nunjucks";
import { z } from "zod";
import { getWittyWeatherFromCloudRun, warmupCloudRun } from './gemini-cloud-run';
import { fetchLocationData } from "./location";
import { fetchWeatherData } from "./weatherapi";

// Load .env file
dotenv.config();

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_API_URL = "https://geocode.maps.co/search";
const HTTP_CLIENT = axios;

const environment = process.env['NODE_ENV'];
const templates = new nunjucks.Environment(new nunjucks.FileSystemLoader("dist/templates"));

// Optimized cache with automatic cleanup
const cache = new Map<string, { html: string, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Prevent memory leaks

function getCacheKey(location: string): string {
  return `weather_${location.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

function isCacheValid(key: string): boolean {
  const cached = cache.get(key);
  if (cached === undefined) return false;
  const cachedData = cached as { timestamp: number; html: string };
  return Date.now() - cachedData.timestamp < CACHE_DURATION;
}

function cleanupCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach((key) => cache.delete(key));
  
  // If cache is still too large, remove oldest entries
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => (a[1]).timestamp - (b[1]).timestamp);
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cache.delete(key));
  }
}

const server = fastify_fastify({
  logger: true,
});

// middlewares
{
  // process forms
  server.register(formBody);

  // serve static files
  server.register(staticFiles, {
    root: path.join(process.cwd(), 'dist'),
    prefix: '/static/',
  });
}

const weatherCodeToImage = (code: number): string => {
  switch (code) {
    case 0: return "/static/img/clear.svg";
    case 1: return "/static/img/clear.svg";
    case 2: return "/static/img/cloudy.svg";
    case 3: return "/static/img/overcast.svg";
    case 45: return "/static/img/fog.svg";
    case 48: return "/static/img/fog.svg";
    case 51: return "/static/img/drizzle.svg";
    case 53: return "/static/img/drizzle.svg";
    case 55: return "/static/img/drizzle.svg";
    case 56: return "/static/img/drizzle.svg";
    case 57: return "/static/img/drizzle.svg";
    case 61: return "/static/img/rain.svg";
    case 63: return "/static/img/rain.svg";
    case 65: return "/static/img/rain.svg";
    case 66: return "/static/img/rain.svg";
    case 67: return "/static/img/rain.svg";
    case 71: return "/static/img/snow.svg";
    case 73: return "/static/img/snow.svg";
    case 75: return "/static/img/snow.svg";
    case 77: return "/static/img/snow.svg";
    case 80: return "/static/img/rain.svg";
    case 81: return "/static/img/rain.svg";
    case 82: return "/static/img/rain.svg";
    case 85: return "/static/img/snow.svg";
    case 86: return "/static/img/snow.svg";
    case 95: return "/static/img/thunderstorm.svg";
    case 96: return "/static/img/thunderstorm.svg";
    case 99: return "/static/img/thunderstorm.svg";
    default: return "/static/img/info.svg";
  }
};

const locationSchema = z.object({
  location: z.string().min(1).max(100), // Add validation
});

// Health check endpoint
server.get("/health", () => ({
  status: "healthy", 
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  cacheSize: cache.size
}));

server.get("/", async (request, reply) => {
  const queryParams = request.query as Record<string, string>;
  
  // If no location provided, show the get started page and warm up Cloud Run
  if (queryParams['location'] === undefined || queryParams['location'] === '') {
    // Warm up Cloud Run function in background (don't wait for it)
    void warmupCloudRun().catch(() => {
      // Silent fail
    }); 
    
    const rendered = templates.render("get_started.njk", { environment });
    return await reply
      .header("Content-Type", "text/html; charset=utf-8")
      .send(rendered);
  }
  
  try {
    const { location } = locationSchema.parse(queryParams);
    
    // Check cache first
    const cacheKey = getCacheKey(location);
    if (isCacheValid(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (cachedData !== undefined) {
        return await reply
          .header("Content-Type", "text/html; charset=utf-8")
          .send(cachedData.html);
      }
    }
    
    // Cleanup cache periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup on each request
      cleanupCache();
    }
    
    // Performance monitoring
    const startTime = Date.now();
    
    const locationStart = Date.now();
    const locationInfo = await fetchLocationData(HTTP_CLIENT, GEOCODE_API_URL, location);
    const locationTime = Date.now() - locationStart;
    
    const weatherStart = Date.now();
    const weatherInfo = await fetchWeatherData(HTTP_CLIENT, WEATHER_API_URL, locationInfo.lat, locationInfo.lon, locationInfo.display_name);
    const weatherTime = Date.now() - weatherStart;

    let wittyWeather = '';
    let geminiTime = 0;
    try {
      const geminiStart = Date.now();
      const latNum = parseFloat(locationInfo.lat);
      const lonNum = parseFloat(locationInfo.lon);
      wittyWeather = await getWittyWeatherFromCloudRun(weatherInfo, latNum, lonNum);
      geminiTime = Date.now() - geminiStart;
    } catch (e) {
      wittyWeather = 'Unable to generate a witty weather summary.';
    }
    
    const totalTime = Date.now() - startTime;
    
    // Log performance metrics
    server.log.info({
      location,
      performance: {
        locationTime: `${locationTime}ms`,
        weatherTime: `${weatherTime}ms`, 
        geminiTime: `${geminiTime}ms`,
        totalTime: `${totalTime}ms`
      }
    });

    const rendered = templates.render("weather.njk", {
      environment,
      location: locationInfo.display_name,
      currentDate: new Date().toDateString(),
      weather: {
        ...weatherInfo,
        conditionImg: weatherCodeToImage(weatherInfo.weathercode),
        condition: weatherInfo.condition(),
        lowTemp: weatherInfo.lowTemp(),
        highTemp: weatherInfo.highTemp(),
      },
      wittyWeather,
    });
    
    // Cache the result
    cache.set(cacheKey, {
      html: rendered,
      timestamp: Date.now()
    });
    
    return await reply
      .header("Content-Type", "text/html; charset=utf-8")
      .send(rendered);
  } catch (e) {
    server.log.error(e);
    const rendered = templates.render("get_started.njk", { environment });
    return await reply
      .header("Content-Type", "text/html; charset=utf-8")
      .send(rendered);
  }
});

const start = async (): Promise<void> => {
  try {
    const port = typeof process.env['PORT'] === 'string' ? Number(process.env['PORT']) : 8089;
    await server.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

