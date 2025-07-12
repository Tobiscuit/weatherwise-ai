"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLocationData = void 0;
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
async function fetchLocationData(apiUrl, location) {
    const options = {
        method: "GET",
        url: apiUrl,
        params: {
            q: location,
            api_key: process.env.GEOCODE_API_KEY
        },
    };
    // This won't always work. If the API updates, then this may result in a runtime error.
    // Later we will use Zod to fix this.
    const response = await axios_1.default.request(options);
    if (response.status === 200) {
        if (response.data.length > 0) {
            return response.data[0];
        }
        else {
            throw new Error(`Unable to find location information for ${location}`);
        }
    }
    else {
        throw new Error("Failed to fetch location data");
    }
}
exports.fetchLocationData = fetchLocationData;
