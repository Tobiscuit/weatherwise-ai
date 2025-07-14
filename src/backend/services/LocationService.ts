import { z } from 'zod';
import { LocationServiceError } from '../errors';
import { locationSchema } from '../location';
import type { LocationInfo } from '../location';
import type { AxiosStatic } from 'axios';

export class LocationService {
  constructor(
    private readonly httpClient: AxiosStatic,
    private readonly apiUrl: string,
    private readonly apiKey?: string
  ) {}

  async fetchLocation(location: string): Promise<LocationInfo> {
    const url = new URL(this.apiUrl);
    url.searchParams.append('q', location);

    const apiKey = this.apiKey;
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      url.searchParams.append('api_key', apiKey);
    }

    try {
      const response = await this.httpClient.get<unknown>(url.toString(), {
        timeout: 5000,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch location data with status: ${response.status}`);
      }
      
      const result = locationSchema.safeParse(response.data);

      if (!result.success) {
        throw new Error(`Invalid location data format: ${result.error.message}`);
      }
      
      return result.data[0];

    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error in LocationService:', error.flatten());
        throw new LocationServiceError('Invalid data received from location service.');
      }
      if (error instanceof Error) {
        console.error('Error in LocationService:', error.message);
        throw new LocationServiceError(`Could not fetch location data: ${error.message}`);
      }
      console.error('Unknown error in LocationService:', error);
      throw new LocationServiceError('An unexpected error occurred while fetching location data.');
    }
  }
} 