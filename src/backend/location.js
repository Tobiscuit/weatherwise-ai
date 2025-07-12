"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLocationData = void 0;
const zod_1 = require("zod");
require("dotenv/config");
const locationInfoSchema = zod_1.z.object({
    lat: zod_1.z.string(),
    lon: zod_1.z.string(),
    display_name: zod_1.z.string(),
});
async function fetchLocationData(axios, apiUrl, location) {
    const options = {
        method: "GET",
        url: apiUrl,
        params: {
            q: location,
            api_key: process.env.GEOCODE_API_KEY
        },
        timeout: 5000, // 5 second timeout
    };
    try {
        const response = await axios.request(options);
        if (response.status === 200 && response.data !== undefined && Array.isArray(response.data) && response.data.length > 0) {
            try {
                return locationInfoSchema.parse(response.data[0]);
            }
            catch (e) {
                throw new Error(`Unable to find location information for ${location}`);
            }
        }
        else {
            throw new Error(`No location found for ${location}`);
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(`Location lookup timed out for ${location}`);
            }
            if (error.response?.status === 429) {
                throw new Error('Location service is busy. Please try again.');
            }
        }
        throw new Error(`Failed to fetch location data for ${location}`);
    }
}
exports.fetchLocationData = fetchLocationData;
