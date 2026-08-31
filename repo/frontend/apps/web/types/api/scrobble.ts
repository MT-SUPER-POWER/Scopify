export interface ScrobbleV1Request {
  artist?: string;
  bitrate?: number;
  id: number;
  level?: string;
  name?: string;
  source?: string;
  sourceid?: string;
  time: number;
  total?: number;
  vip?: boolean;
}

export interface ScrobbleV1Response {
  code: number;
  data?: string;
  details?: unknown;
  msg?: string;
}
