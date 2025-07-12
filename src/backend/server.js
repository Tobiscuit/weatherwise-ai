"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const formbody_1 = __importDefault(require("@fastify/formbody"));
const static_1 = __importDefault(require("@fastify/static"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const fastify_1 = require("fastify");
const nunjucks_1 = __importDefault(require("nunjucks"));
const zod_1 = require("zod");
const gemini_cloud_run_1 = require("./gemini-cloud-run");
const location_1 = require("./location");
const weatherapi_1 = require("./weatherapi");
// Load .env file
dotenv_1.default.config();
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_API_URL = "https://geocode.maps.co/search";
const HTTP_CLIENT = axios_1.default;
const environment = process.env.NODE_ENV;
const templates = new nunjucks_1.default.Environment(new nunjucks_1.default.FileSystemLoader("src/backend/templates"));
// Optimized cache with automatic cleanup
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Prevent memory leaks
function getCacheKey(location) {
    return `weather_${location.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}
function isCacheValid(key) {
    const cached = cache.get(key);
    if (cached === undefined)
        return false;
    const cachedData = cached;
    return Date.now() - cachedData.timestamp < CACHE_DURATION;
}
function cleanupCache() {
    const now = Date.now();
    const keysToDelete = [];
    for (const [key, value] of cache.entries()) {
        const cacheValue = value;
        if (now - cacheValue.timestamp > CACHE_DURATION) {
            keysToDelete.push(key);
        }
    }
    keysToDelete.forEach((key) => cache.delete(key));
    // If cache is still too large, remove oldest entries
    if (cache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
        toRemove.forEach(([key]) => cache.delete(key));
    }
}
const server = (0, fastify_1.fastify)({
    logger: true,
});
// middlewares
{
    // process forms
    server.register(formbody_1.default);
    // serve static files
    server.register(static_1.default, {
        root: path_1.default.join(__dirname, '../../dist'),
    });
}
const weatherCodeToImage = (code) => {
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
const locationSchema = zod_1.z.object({
    location: zod_1.z.string().min(1).max(100), // Add validation
});
// Health check endpoint
server.get("/health", async () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cacheSize: cache.size
}));
server.get("/", async (request, reply) => {
    const queryParams = request.query;
    // If no location provided, show the get started page and warm up Cloud Run
    if (queryParams.location === undefined || queryParams.location === '') {
        // Warm up Cloud Run function in background (don't wait for it)
        (0, gemini_cloud_run_1.warmupCloudRun)().catch(() => { }); // Silent fail
        const rendered = templates.render("get_started.njk", { environment });
        return reply
            .header("Content-Type", "text/html; charset=utf-8")
            .send(rendered);
    }
    try {
        const { location } = locationSchema.parse(queryParams);
        // Check cache first
        const cacheKey = getCacheKey(location);
        if (isCacheValid(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            return reply
                .header("Content-Type", "text/html; charset=utf-8")
                .send(cachedData.html);
        }
        // Cleanup cache periodically
        if (Math.random() < 0.1) { // 10% chance to cleanup on each request
            cleanupCache();
        }
        // Performance monitoring
        const startTime = Date.now();
        const locationStart = Date.now();
        const locationInfo = await (0, location_1.fetchLocationData)(HTTP_CLIENT, GEOCODE_API_URL, location);
        const locationTime = Date.now() - locationStart;
        const weatherStart = Date.now();
        const weatherInfo = await (0, weatherapi_1.fetchWeatherData)(HTTP_CLIENT, WEATHER_API_URL, locationInfo.lat, locationInfo.lon, locationInfo.display_name);
        const weatherTime = Date.now() - weatherStart;
        let wittyWeather = '';
        let geminiTime = 0;
        try {
            const geminiStart = Date.now();
            wittyWeather = await (0, gemini_cloud_run_1.getWittyWeatherFromCloudRun)(weatherInfo, locationInfo.lat, locationInfo.lon);
            geminiTime = Date.now() - geminiStart;
        }
        catch (e) {
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
        return reply
            .header("Content-Type", "text/html; charset=utf-8")
            .send(rendered);
    }
    catch (e) {
        server.log.error(e);
        const rendered = templates.render("get_started.njk", { environment });
        return reply
            .header("Content-Type", "text/html; charset=utf-8")
            .send(rendered);
    }
});
const start = async () => {
    try {
        await server.listen({ port: 8089, host: '192.168.1.107' });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
