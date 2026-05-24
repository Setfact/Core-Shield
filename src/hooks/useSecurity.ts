import { useState, useEffect } from 'react';
import { ref, query, limitToLast, onValue, push, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { SecurityLog } from '@/types/firebase';

export function useSecurity() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);

  useEffect(() => {
    const logsRef = query(ref(db, 'logs'), limitToLast(20));
    const unsub = onValue(logsRef, (snapshot) => {
      const fetchedLogs: SecurityLog[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          fetchedLogs.push({ id: childSnapshot.key, ...childSnapshot.val() } as SecurityLog);
        });
      } else {
        // Fallback or explicit handling if path is empty
        setLogs([]);
        return;
      }
      // Sort manually by time just in case if no orderBy was used
      fetchedLogs.sort((a, b) => new Date(`1970/01/01 ${b.time}`).getTime() - new Date(`1970/01/01 ${a.time}`).getTime());
      setLogs(fetchedLogs);
    });

    return () => unsub();
  }, []);

  const addLog = async (logData: Omit<SecurityLog, 'id'>) => {
    try {
      const newLogRef = push(ref(db, 'logs'));
      await set(newLogRef, logData);
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  return { logs, addLog };
}
