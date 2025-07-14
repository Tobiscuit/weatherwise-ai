import { GoogleAuth } from 'google-auth-library';
import { GeminiServiceError } from '../errors';
import type { CurrentWeather } from '../weatherapi';
import type { AxiosStatic, AxiosResponse } from 'axios';
import type { AuthClient } from 'google-auth-library/build/src/auth/authclient';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiService {
  private auth: GoogleAuth;
  
  constructor(private readonly httpClient: AxiosStatic) {
    this.auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
  }

  async generateWittySummary(weatherData: CurrentWeather, lat: number, lon: number): Promise<string> {
    const prompt = this.createPrompt(weatherData, lat, lon);
    
    try {
      const client = await this.auth.getClient();
      const accessToken = await this.getAccessToken(client);
      
      const response = await this.makeApiCall(accessToken, prompt);
      
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Could not generate a witty summary.';
    } catch (error: any) {
      console.error('Error in GeminiService:', error.message);
      throw new GeminiServiceError('Failed to generate witty weather summary.');
    }
  }

  private createPrompt(weatherData: CurrentWeather, lat: number, lon: number): string {
    const weatherInfo = {
      temperature: weatherData.temperature,
      condition: weatherData.condition(),
      highTemp: weatherData.highTemp(),
      lowTemp: weatherData.lowTemp(),
    };
    return `You are a witty weather bot. Give a short, funny summary for the weather. Weather data: ${JSON.stringify(weatherInfo)}. Location: lat ${lat}, lon ${lon}.`;
  }

  private async getAccessToken(client: AuthClient): Promise<string> {
    const tokens = await client.getAccessToken();
    if (typeof tokens.token !== 'string' || tokens.token.length === 0) {
      throw new Error('Failed to retrieve a valid access token.');
    }
    return tokens.token;
  }

  private async makeApiCall(accessToken: string, prompt: string): Promise<AxiosResponse<GeminiResponse>> {
    return await this.httpClient.post<GeminiResponse>(
      GEMINI_API_URL,
      { contents: [{ parts: [{ text: prompt }] }] },
      { 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${accessToken}` 
        },
        timeout: 10000,
      }
    );
  }
} 