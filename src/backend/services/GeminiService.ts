import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../config';
import type { CurrentWeather } from '../weatherapi';

export class GeminiService {
  private vertexAI: VertexAI;

  constructor() {
    this.vertexAI = new VertexAI({
      project: config.PROJECT_ID,
      location: 'us-central1',
    });
  }

  async generateWittySummary(weatherData: CurrentWeather, lat: number, lon: number): Promise<string> {
    const model = this.vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a witty weather bot. Give a short, funny summary for the weather at latitude ${lat} and longitude ${lon}.
    
    Current weather data:
    - Condition: ${weatherData.condition()}
    - Current Temperature: ${weatherData.temperature.value}${weatherData.temperature.unit}
    - Today's High: ${weatherData.highTemp()}${weatherData.temperature.unit}
    - Today's Low: ${weatherData.lowTemp()}${weatherData.temperature.unit}`;

    try {
      const result = await model.generateContent(prompt);
      const summary = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      return String(summary ?? 'Could not generate a witty summary.');
      
    } catch (error) {
      console.error('Error calling Vertex AI:', error);
      throw new Error('Failed to communicate with the Vertex AI API.');
    }
  }
}