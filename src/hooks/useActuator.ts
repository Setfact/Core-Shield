import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { FanActuator } from '@/types/firebase';

export function useActuator() {
  const [fanData, setFanData] = useState<FanActuator>({
    mode: 'auto',
    state: 'off',
    speed: 0,
  });

  const fanRef = ref(db, 'actuators/fan');

  useEffect(() => {
    const unsub = onValue(fanRef, (snapshot) => {
      if (snapshot.exists()) {
        const docData = snapshot.val();
        setFanData({
          mode: docData.mode || 'auto',
          state: docData.state || 'off',
          speed: docData.speed || 0,
        });
      } else {
        setFanData({
          mode: 'auto',
          state: 'off',
          speed: 0,
        });
      }
    });

    return () => unsub();
  }, []);

  const setFanMode = async (mode: 'auto' | 'manual') => {
    try {
      await set(ref(db, 'actuators/fan/mode'), mode);
    } catch (error) {
      console.error('Error setting fan mode:', error);
    }
  };

  const setFanState = async (state: 'on' | 'off') => {
    try {
      await set(ref(db, 'actuators/fan/state'), state);
    } catch (error) {
      console.error('Error setting fan state:', error);
    }
  };

  return { fanData, setFanMode, setFanState };
}
