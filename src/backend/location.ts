import { z } from 'zod';

export const locationSchema = z.array(z.object({
  place_id: z.number(),
  licence: z.string(),
  osm_type: z.string(),
  osm_id: z.number(),
  boundingbox: z.array(z.string()),
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
  place_rank: z.number(),
  category: z.string(),
  type: z.string(),
  importance: z.number(),
  address: z.object({
    country_code: z.string().optional(),
  }).optional(),
})).nonempty();

export type LocationInfo = z.infer<typeof locationSchema>[0];

