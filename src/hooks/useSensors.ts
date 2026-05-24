import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { TelemetryData } from '@/types/firebase';

export function useSensors() {
  const [data, setData] = useState<TelemetryData>({
    temperature: 0,
    humidity: 0,
    gasPpm: 0,
  });

  useEffect(() => {
    const telemetryRef = ref(db, 'telemetry/realtime');
    const unsub = onValue(telemetryRef, (snapshot) => {
      if (snapshot.exists()) {
        const docData = snapshot.val() as TelemetryData;
        setData({
          temperature: docData.temperature || 0,
          humidity: docData.humidity || 0,
          gasPpm: docData.gasPpm || 0,
        });
      } else {
        setData({
          temperature: 0,
          humidity: 0,
          gasPpm: 0,
        });
      }
    });

    return () => unsub();
  }, []);

  return data;
}
