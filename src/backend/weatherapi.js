"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWeatherData = exports.CurrentWeather = exports.currentWeatherApiResponseSchema = void 0;
const zod_1 = require("zod");
const weatherCodes = {
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
function shouldUseFahrenheit(displayName) {
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
exports.currentWeatherApiResponseSchema = zod_1.z.object({
    current_weather: zod_1.z.object({
        temperature: zod_1.z.number(),
        windspeed: zod_1.z.number(),
        winddirection: zod_1.z.number(),
        weathercode: zod_1.z.number(),
        is_day: zod_1.z.number(),
        time: zod_1.z.string(),
    }),
    hourly_units: zod_1.z.object({
        temperature_2m: zod_1.z.string(),
    }),
    hourly: zod_1.z.object({
        temperature_2m: zod_1.z.array(zod_1.z.number()),
    })
});
class CurrentWeather {
    constructor(apiResponse) {
        this.temperature = {
            value: apiResponse.current_weather.temperature,
            unit: apiResponse.hourly_units.temperature_2m,
        };
        this.weathercode = apiResponse.current_weather.weathercode;
        this.is_day = apiResponse.current_weather.is_day === 1;
        this.time = apiResponse.current_weather.time;
        this.hourlyTemp = apiResponse.hourly.temperature_2m;
    }
    lowTemp() {
        return this.hourlyTemp.reduce((a, b) => Math.min(a, b));
    }
    highTemp() {
        return this.hourlyTemp.reduce((a, b) => Math.max(a, b));
    }
    condition() {
        return weatherCodes[this.weathercode];
    }
}
exports.CurrentWeather = CurrentWeather;
async function fetchWeatherData(axios, apiUrl, lat, lon, displayName) {
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
            const res = exports.currentWeatherApiResponseSchema.parse(response.data);
            return new CurrentWeather(res);
        }
        catch (e) {
            throw new Error("Received invalid API response");
        }
    }
    else {
        throw new Error("Failed to fetch weather data");
    }
}
exports.fetchWeatherData = fetchWeatherData;
