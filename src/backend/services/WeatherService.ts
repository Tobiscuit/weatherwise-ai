import { z } from 'zod';
import { WeatherServiceError } from '../errors';
import { CurrentWeather, WeatherDataSchema } from '../weatherapi';
import type { LocationInfo } from '../location';
import type { AxiosStatic } from 'axios';

export class WeatherService {
  constructor(
    private readonly httpClient: AxiosStatic,
    private readonly apiUrl: string
  ) {}

  async fetchWeather(locationInfo: LocationInfo): Promise<CurrentWeather> {
    const { lat, lon } = locationInfo;
    const useFahrenheit = this.isCountryUsingFahrenheit(locationInfo);

    const options = {
      method: "GET",
      url: this.apiUrl,
      params: {
        latitude: lat,
        longitude: lon,
        hourly: "temperature_2m",
        temperature_unit: useFahrenheit ? "fahrenheit" : "celsius",
        current_weather: true,
        forecast_days: 1,
      },
      timeout: 5000,
    };

    try {
      const response = await this.httpClient.request<unknown>(options);

      if (response.status !== 200) {
        throw new Error(`Failed with status: ${response.status}`);
      }

      const result = WeatherDataSchema.safeParse(response.data);
      if (!result.success) {
        throw new Error(`Invalid data format: ${result.error.message}`);
      }
      
      return new CurrentWeather(result.data);

    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error in WeatherService:', error.flatten());
        throw new WeatherServiceError('Invalid data received from weather service.');
      }
      if (error instanceof Error) {
        console.error('Error in WeatherService:', error.message);
        throw new WeatherServiceError(`Could not fetch weather data: ${error.message}`);
      }
      console.error('Unknown error in WeatherService:', error);
      throw new WeatherServiceError('An unexpected error occurred while fetching weather data.');
    }
  }

  private isCountryUsingFahrenheit(locationInfo: LocationInfo): boolean {
    const fahrenheitCountries = ["us", "bs", "bz", "ky", "lr", "pw", "mh", "fm"];
    const countryCode = locationInfo.address?.country_code?.toLowerCase();
    const displayName = locationInfo.display_name?.toLowerCase() ?? "";
    
    if (typeof countryCode === 'string' && fahrenheitCountries.includes(countryCode)) {
      return true;
    }
    
    if (displayName.length > 0 && displayName.includes('usa')) {
      return true;
    }

    return false;
  }
} 