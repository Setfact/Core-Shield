export interface TelemetryData {
  temperature: number;
  humidity: number;
  gasPpm: number;
}

export interface SecurityLog {
  id: string;
  time: string;
  sensor: string;
  location: string;
  trigger: string;
  status: 'OK' | 'Warning' | 'Critical';
  duration?: number;
}

export interface FanActuator {
  mode: 'auto' | 'manual';
  state: 'on' | 'off';
  speed: number;
}
