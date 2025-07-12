"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWittyWeatherParagraph = void 0;
const axios_1 = __importDefault(require("axios"));
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const REQUEST_TIMEOUT = 8000; // 8 seconds - reduced for faster response
function getLocationTime(lat, lon) {
    try {
        // Use longitude-based timezone estimation
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        // Estimate timezone offset based on longitude (rough approximation)
        const longitude = parseFloat(lon);
        const estimatedOffset = Math.round(longitude / 15) * 60; // 15 degrees = 1 hour
        const locationTime = new Date(utcTime + (estimatedOffset * 60000));
        return {
            time: locationTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            date: locationTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            })
        };
    }
    catch (error) {
        // Fallback to UTC time if calculation fails
        const now = new Date();
        return {
            time: now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            date: now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            })
        };
    }
}
async function getWittyWeatherParagraph(weatherData, lat, lon) {
    // Get API key at function call time
    const GEMINI_API_KEY = typeof process.env.GEMINI_API_KEY === 'string' ? process.env.GEMINI_API_KEY : '';
    if (GEMINI_API_KEY === '') {
        throw new Error('Gemini API key is not set');
    }
    // Get location-specific time if coordinates are provided
    let currentTime = '';
    let currentDate = '';
    if (lat !== undefined && lat !== '' && lon !== undefined && lon !== '') {
        const locationTime = getLocationTime(lat, lon);
        currentTime = locationTime.time;
        currentDate = locationTime.date;
    }
    else {
        // Fallback to server time
        const now = new Date();
        currentTime = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        currentDate = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }
    const prompt = `You are Nimbus, a friendly cloud mascot who loves talking about weather! Write a brief, witty paragraph about the current weather as if you're chatting with a friend. The current local time at this location is ${currentTime} on ${currentDate}. 

Weather data: Temperature ${weatherData.temperature?.value}${weatherData.temperature?.unit}, Condition: ${weatherData.condition?.()}, High: ${weatherData.highTemp?.()}${weatherData.temperature?.unit}, Low: ${weatherData.lowTemp?.()}${weatherData.temperature?.unit}.

Be cheerful, use weather puns if appropriate, and make it feel like a friendly conversation. Use the current local time I provided, not any time from the weather data.`;
    try {
        const response = await axios_1.default.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: [{ parts: [{ text: prompt }] }]
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: REQUEST_TIMEOUT
        });
        // Simple response parsing with proper typing
        const responseData = response.data;
        const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text !== undefined && text !== null && text.length > 0) {
            return text;
        }
        else {
            return 'No witty weather available.';
        }
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
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
exports.getWittyWeatherParagraph = getWittyWeatherParagraph;
