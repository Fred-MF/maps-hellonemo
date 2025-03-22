// Types pour les API MaaSify

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export enum TransitMode {
  BUS = 'BUS',
  TRAM = 'TRAM',
  SUBWAY = 'SUBWAY',
  RAIL = 'RAIL',
  FERRY = 'FERRY',
  CABLE_CAR = 'CABLE_CAR',
  GONDOLA = 'GONDOLA',
  FUNICULAR = 'FUNICULAR',
  TROLLEYBUS = 'TROLLEYBUS',
  MONORAIL = 'MONORAIL'
}

export interface Feed {
  feedId: string;
  agencies: any[];
}

export interface Network {
  id: string;
  name: string;
  display_name: string | null;
  gtfs_id: string;
  feed_id: string;
  region_id: string;
  is_available: boolean;
  last_check: string | null;
  error_message: string | null;
  created_at?: string;
  updated_at?: string;
  operators?: Operator[];
}

export interface Operator {
  id: string;
  network_id: string;
  name: string;
  gtfs_id: string;
  is_active: boolean;
}

export interface Route {
  gtfsId: string;
  shortName: string;
  longName: string;
  mode: string;
  type: number;
  color: string;
  textColor: string;
  origin?: string;
  destination?: string;
  desc?: string;
  patterns?: Pattern[];
}

export interface Pattern {
  code: string;
  name: string;
  stops: Stop[];
  headsign?: string;
  directionId?: number;
  geometry?: {
    points: string;
    length: number;
  };
}

export interface Stop {
  gtfsId: string;
  name: string;
  code?: string;
  desc?: string;
  lat?: number;
  lon?: number;
  zoneId?: string;
  platformCode?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  realtimeDeparture?: string;
  realtimeArrival?: string;
}

export interface Region {
  id: string;
  name: string;
  apiUrl: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}