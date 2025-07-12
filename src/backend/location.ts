import axios from 'axios';
import { z } from "zod";

const locationSchema = z.array(z.object({
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
})).nonempty();

export type LocationInfo = z.infer<typeof locationSchema>[0];

export async function fetchLocationData(
  client: typeof axios,
  apiURL: string,
  location: string
): Promise<LocationInfo> {
  const GEOCODE_API_KEY = process.env['GEOCODE_API_KEY'];
  const url = new URL(apiURL);
  url.searchParams.append('q', location);
  if (GEOCODE_API_KEY && GEOCODE_API_KEY.length > 0) {
    url.searchParams.append('api_key', GEOCODE_API_KEY);
  }
  
  const response = await client.get(url.toString());
  const locations = locationSchema.parse(response.data);
  return locations[0];
}

