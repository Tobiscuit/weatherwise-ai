import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { WeatherService } from './WeatherService';
import { WeatherServiceError } from '../errors';
import type { LocationInfo } from '../location';

const API_URL = 'http://test.com/forecast';

// A mock LocationInfo object for testing
const mockLocation: LocationInfo = {
  place_id: 1,
  licence: 'Test Licence',
  osm_type: 'relation',
  osm_id: 12345,
  boundingbox: ['-74.25909', '-73.70018', '40.47739', '40.91758'],
  lat: '40.71273',
  lon: '-74.00602',
  display_name: 'New York, USA',
  place_rank: 30,
  category: 'place',
  type: 'city',
  importance: 1.0,
  address: { country_code: 'us' }
};

describe('WeatherService', () => {
  let mock: MockAdapter;
  let service: WeatherService;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    service = new WeatherService(axios, API_URL);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should fetch and return weather information on success', async () => {
    const mockResponse = {
      latitude: 40.71,
      longitude: -74.01,
      generationtime_ms: 0.1,
      utc_offset_seconds: 0,
      timezone: 'GMT',
      timezone_abbreviation: 'GMT',
      elevation: 10,
      current_weather: {
        temperature: 25,
        windspeed: 10,
        winddirection: 180,
        weathercode: 0,
        is_day: 1,
        time: new Date().toISOString(),
      },
      hourly_units: { temperature_2m: '°C' },
      hourly: { temperature_2m: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
    };
    
    mock.onGet(API_URL).reply(200, mockResponse);

    const result = await service.fetchWeather(mockLocation);
    expect(result).toBeDefined();
    expect(result.temperature.value).toBe(25);
    expect(result.condition()).toBe('Clear sky');
  });

  it('should throw WeatherServiceError if API call fails', async () => {
    mock.onGet(API_URL).reply(500);
    await expect(service.fetchWeather(mockLocation)).rejects.toThrow(WeatherServiceError);
  });

  it('should throw WeatherServiceError if response data is invalid', async () => {
    const invalidResponse = { message: 'This is not weather data' };
    mock.onGet(API_URL).reply(200, invalidResponse);
    await expect(service.fetchWeather(mockLocation)).rejects.toThrow(WeatherServiceError);
  });
}); 