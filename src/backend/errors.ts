export class LocationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

export class GeminiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiServiceError';
  }
} 