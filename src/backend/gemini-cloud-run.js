"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmupCloudRun = exports.getWittyWeatherFromCloudRun = void 0;
const axios_1 = __importDefault(require("axios"));
// Cloud Run function URL (will be set after deployment)
const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL !== undefined && process.env.CLOUD_RUN_URL !== ''
    ? process.env.CLOUD_RUN_URL
    : 'https://weather-gemini-xxxxx-uc.a.run.app';
async function getWittyWeatherFromCloudRun(weatherData, lat, lon) {
    try {
        const response = await axios_1.default.post(`${CLOUD_RUN_URL}/generateWeather`, {
            weatherData: {
                temperature: weatherData.temperature,
                condition: weatherData.condition?.(),
                highTemp: weatherData.highTemp?.(),
                lowTemp: weatherData.lowTemp?.(),
            },
            lat,
            lon
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 // 10 seconds for Cloud Run
        });
        const data = response.data;
        return data.wittyWeather;
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
exports.getWittyWeatherFromCloudRun = getWittyWeatherFromCloudRun;
// Warm up the Cloud Run function
async function warmupCloudRun() {
    try {
        await axios_1.default.get(`${CLOUD_RUN_URL}/warmup`, {
            timeout: 5000
        });
        console.log('✅ Cloud Run function warmed up');
    }
    catch (error) {
        console.log('⚠️ Could not warm up Cloud Run function:', error);
    }
}
exports.warmupCloudRun = warmupCloudRun;
