import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { GeminiService } from './GeminiService';
import { GeminiServiceError } from '../errors';
import { CurrentWeather } from '../weatherapi';
import { GoogleAuth } from 'google-auth-library';

// Mock the GoogleAuth library
jest.mock('google-auth-library');

const mockWeather = new CurrentWeather({
  latitude: 40.71,
  longitude: -74.01,
  generationtime_ms: 0.1,
  utc_offset_seconds: 0,
  timezone: 'GMT',
  timezone_abbreviation: 'GMT',
  elevation: 10,
  current_weather: {
    temperature: 25, windspeed: 10, winddirection: 180,
    weathercode: 0, is_day: 1, time: new Date().toISOString(),
  },
  hourly_units: { temperature_2m: '°C' },
  hourly: { temperature_2m: Array(24).fill(25) },
});

describe('GeminiService', () => {
  let mockAxios: MockAdapter;
  let service: GeminiService;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    service = new GeminiService(axios);
  });

  afterEach(() => {
    mockAxios.restore();
    jest.clearAllMocks();
  });

  it('should generate a witty summary on success', async () => {
    const mockAuthClient = {
      getAccessToken: jest.fn().mockResolvedValue({ token: 'test-token' }),
    };
    const mockGetClient = jest.fn().mockResolvedValue(mockAuthClient);
    (GoogleAuth as jest.Mock).mockImplementation(() => ({
      getClient: mockGetClient,
    }));
    
    // Re-initialize service with the mock in place for this test
    service = new GeminiService(axios);

    const mockResponse = {
      candidates: [{
        content: { parts: [{ text: 'It is sunny!' }] }
      }]
    };
    mockAxios.onPost().reply(200, mockResponse);

    const result = await service.generateWittySummary(mockWeather, 40.71, -74.01);
    expect(result).toBe('It is sunny!');
    expect(mockGetClient).toHaveBeenCalled();
  });

  it('should throw GeminiServiceError if API call fails', async () => {
    mockAxios.onPost().reply(500);
    await expect(service.generateWittySummary(mockWeather, 40.71, -74.01)).rejects.toThrow(GeminiServiceError);
  });

  it('should return a default summary if response is malformed', async () => {
    const malformedResponse = { candidates: [] };
    mockAxios.onPost().reply(200, malformedResponse);
    const summary = await service.generateWittySummary(mockWeather, 40.71, -74.01);
    expect(summary).toBe('Could not generate a witty summary.');
  });

  it('should throw GeminiServiceError if auth fails', async () => {
    const mockGetClient = jest.fn().mockRejectedValue(new Error('Auth failed'));
    (GoogleAuth as jest.Mock).mockImplementation(() => ({
      getClient: mockGetClient,
    }));
    
    // Re-initialize service with the mock in place for this test
    service = new GeminiService(axios);
    
    await expect(service.generateWittySummary(mockWeather, 40.71, -74.01)).rejects.toThrow(GeminiServiceError);
  });
}); 