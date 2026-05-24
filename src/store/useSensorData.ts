import { create } from 'zustand';

export type SecurityStatus = 'Safe' | 'Warning' | 'Intrusion' | 'Alarm';

export interface SecurityEvent {
  id: string;
  time: string;
  sensor: string;
  location: string;
  trigger: string;
  duration: number;
  status: 'OK' | 'Warning' | 'Critical';
}

interface SensorDataState {
  currentTemp: number;
  currentHumidity: number;
  currentGas: number;
  securityStatus: SecurityStatus;
  historyPoints: { time: string; temperature: number; humidity: number; gasLevel: number }[];
  fanMode: 'Auto' | 'Manual';
  fanManualState: 'ON' | 'OFF';
  fanSpeed: number;
  securityEvents: SecurityEvent[];
  alertThresholds: {
    tempWarn: number;
    tempDanger: number;
    gasWarn: number;
    gasDanger: number;
    humidWarn: number;
    humidDanger: number;
  };
  setFanMode: (mode: 'Auto' | 'Manual') => void;
  setFanManualState: (state: 'ON' | 'OFF') => void;
  updateThresholds: (thresholds: Partial<SensorDataState['alertThresholds']>) => void;
  tick: () => void;
}

const generateInitialHistory = () => {
  const points = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    points.push({
      time: `${d.getHours().toString().padStart(2, '0')}:00`,
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 20,
      gasLevel: 50 + Math.random() * 100,
    });
  }
  return points;
};

const initialEvents: SecurityEvent[] = [
  { id: '1', time: '08:15 AM', sensor: 'PIR', location: 'Front Door', trigger: 'Motion Detected', duration: 3, status: 'OK' },
  { id: '2', time: '08:45 AM', sensor: 'Ultrasonic', location: 'Rack 2', trigger: 'Proximity < 50cm', duration: 5, status: 'OK' },
  { id: '3', time: '09:12 AM', sensor: 'PIR', location: 'Back Door', trigger: 'Motion Detected', duration: 2, status: 'OK' },
  { id: '4', time: '09:30 AM', sensor: 'PIR', location: 'Server Room', trigger: 'Motion Detected', duration: 12, status: 'Warning' },
  { id: '5', time: '10:05 AM', sensor: 'Ultrasonic', location: 'Rack 1', trigger: 'Proximity < 20cm', duration: 4, status: 'OK' },
  { id: '6', time: '10:22 AM', sensor: 'PIR', location: 'Front Door', trigger: 'Motion Detected', duration: 2, status: 'OK' },
  { id: '7', time: '10:45 AM', sensor: 'Ultrasonic', location: 'Front Door', trigger: 'Ultrasonic < 10cm', duration: 2, status: 'OK' },
  { id: '8', time: '10:58 AM', sensor: 'PIR', location: 'Back Door', trigger: 'Motion Detected', duration: 1, status: 'Warning' },
  { id: '9', time: '11:02 AM', sensor: 'Ultrasonic', location: 'Rack 1', trigger: 'Person loitering at rack for 23 seconds', duration: 23, status: 'Critical' },
  { id: '10', time: '11:15 AM', sensor: 'PIR', location: 'Server Room', trigger: 'Motion Detected', duration: 3, status: 'OK' },
  { id: '11', time: '11:40 AM', sensor: 'Ultrasonic', location: 'Rack 3', trigger: 'Proximity < 30cm', duration: 6, status: 'OK' },
  { id: '12', time: '12:05 PM', sensor: 'PIR', location: 'Back Door', trigger: 'Motion Detected', duration: 1, status: 'OK' },
  { id: '13', time: '12:30 PM', sensor: 'Ultrasonic', location: 'Rack 2', trigger: 'Proximity < 40cm', duration: 8, status: 'Warning' },
  { id: '14', time: '01:10 PM', sensor: 'PIR', location: 'Front Door', trigger: 'Motion Detected', duration: 2, status: 'OK' },
  { id: '15', time: '01:45 PM', sensor: 'Ultrasonic', location: 'Rack 1', trigger: 'Proximity < 10cm', duration: 16, status: 'Critical' },
  { id: '16', time: '02:00 PM', sensor: 'PIR', location: 'Server Room', trigger: 'Motion Detected', duration: 4, status: 'OK' },
];

export const useSensorData = create<SensorDataState>((set) => ({
  currentTemp: 25,
  currentHumidity: 45,
  currentGas: 100,
  securityStatus: 'Alarm',
  historyPoints: generateInitialHistory(),
  fanMode: 'Auto',
  fanManualState: 'OFF',
  fanSpeed: 25,
  securityEvents: initialEvents.sort((a, b) => new Date(`1970/01/01 ${b.time}`).getTime() - new Date(`1970/01/01 ${a.time}`).getTime()),
  alertThresholds: {
    tempWarn: 35,
    tempDanger: 42,
    gasWarn: 300,
    gasDanger: 600,
    humidWarn: 70,
    humidDanger: 80,
  },
  setFanMode: (mode) => set({ fanMode: mode }),
  setFanManualState: (state) => set({ fanManualState: state }),
  updateThresholds: (t) => set((state) => ({ alertThresholds: { ...state.alertThresholds, ...t } })),
  tick: () =>
    set((state) => {
      const newTemp = Math.max(18, Math.min(45, state.currentTemp + (Math.random() - 0.5) * 0.5));
      const newHumid = Math.max(30, Math.min(80, state.currentHumidity + (Math.random() - 0.5) * 1));
      const newGas = Math.max(0, Math.min(900, state.currentGas + (Math.random() - 0.5) * 5 + (Math.random() > 0.95 ? 50 : 0)));

      let speed = state.fanSpeed;
      if (state.fanMode === 'Auto') {
        speed = Math.min(100, Math.max(0, (newTemp - 20) * 5));
      } else {
        speed = state.fanManualState === 'ON' ? 100 : 0;
      }

      const hasCritical = state.securityEvents.some(e => e.status === 'Critical' && e.sensor === 'Ultrasonic' && e.duration >= 15);
      const newSecurityStatus = hasCritical ? 'Alarm' : (state.securityEvents.some(e => e.status === 'Warning') ? 'Warning' : 'Safe');

      return {
        currentTemp: newTemp,
        currentHumidity: newHumid,
        currentGas: newGas,
        fanSpeed: speed,
        securityStatus: newSecurityStatus,
      };
    }),
}));

setInterval(() => {
  useSensorData.getState().tick();
}, 3000);
