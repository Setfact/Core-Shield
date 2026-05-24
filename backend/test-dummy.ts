const FIREBASE_LOGS_URL = "https://coreshield-6e0d3-default-rtdb.asia-southeast1.firebasedatabase.app/logs.json";

async function run() {
  const payload = {
    details: "SIMULASI TEST: Sistem AI Antigravity mendeteksi bayangan mencurigakan",
    event: "Uji Coba Otomatis",
    timestamp: new Date().toISOString(),
    type: "danger"
  };

  console.log("🔥 Mengirim dummy data SECURITY LOG ke Firebase...");
  await fetch(FIREBASE_LOGS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  console.log("🔥 Mengirim dummy data SUHU KRITIS ke Firebase Telemetry...");
  await fetch("https://coreshield-6e0d3-default-rtdb.asia-southeast1.firebasedatabase.app/telemetry/realtime.json", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ temperature: 99.9 })
  });
  
  console.log("✅ Dummy data terkirim! Silakan cek Telegram Anda. Suhu akan kembali normal dalam 5 detik...");
  
  setTimeout(async () => {
    await fetch("https://coreshield-6e0d3-default-rtdb.asia-southeast1.firebasedatabase.app/telemetry/realtime.json", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ temperature: 25.5 })
    });
    console.log("Suhu dinormalkan kembali ke 25.5°C.");
  }, 5000);
}

run();
