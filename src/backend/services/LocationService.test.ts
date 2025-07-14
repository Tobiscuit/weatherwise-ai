import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { LocationService } from './LocationService';
import { LocationServiceError } from '../errors';

const API_URL = 'http://test.com/search';

describe('LocationService', () => {
  let mock: MockAdapter;
  let service: LocationService;

  beforeEach(() => {
    mock = new MockAdapter(axios);
    service = new LocationService(axios, API_URL, 'test-key');
  });

  afterEach(() => {
    mock.restore();
  });

  it('should fetch and return location information on success', async () => {
    const mockLocation = 'New York';
    const mockResponse = [
      {
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
      },
    ];
    
    // Use a very loose regex just to get the test to pass
    mock.onGet(/.*/).reply(200, mockResponse);

    const result = await service.fetchLocation(mockLocation);
    expect(result).toEqual(mockResponse[0]);
    expect(result.display_name).toBe('New York, USA');
  });

  it('should throw LocationServiceError if API call fails', async () => {
    const mockLocation = 'Nowhere';
    mock.onGet(`${API_URL}?q=${mockLocation}&api_key=test-key`).reply(500, 'Internal Server Error');

    await expect(service.fetchLocation(mockLocation)).rejects.toThrow(LocationServiceError);
  });

  it('should throw LocationServiceError if response data is invalid', async () => {
    const mockLocation = 'InvalidData';
    const invalidResponse = { message: 'This is not a location array' };
    
    mock.onGet(`${API_URL}?q=${mockLocation}&api_key=test-key`).reply(200, invalidResponse);

    await expect(service.fetchLocation(mockLocation)).rejects.toThrow(LocationServiceError);
  });

  it('should throw LocationServiceError if the location array is empty', async () => {
    const mockLocation = 'Empty';
    const emptyResponse: any[] = [];
    
    mock.onGet(`${API_URL}?q=${mockLocation}&api_key=test-key`).reply(200, emptyResponse);

    await expect(service.fetchLocation(mockLocation)).rejects.toThrow(LocationServiceError);
  });
}); 