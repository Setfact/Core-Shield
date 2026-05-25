import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const FIREBASE_DB_URL = "https://coreshield-6e0d3-default-rtdb.asia-southeast1.firebasedatabase.app";

// Helper for Telegram MarkdownV2 escaping
function escapeMDV2(text: string): string {
  return text.replace(/[_\[\]()~`>#\+\-=|{}\.!]/g, '\\$&');
}

// 4. Fungsi Pengiriman Telegram
async function sendTelegramAlert(message: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "MarkdownV2"
      })
    });
    if (!res.ok) {
      console.error("Failed to send to Telegram:", await res.text());
    } else {
      console.log("📩 Notifikasi Telegram berhasil dikirim!");
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error);
  }
}

// 3. Logika Integrasi Threshold Dinamis
async function processDangerLog(log: any) {
  try {
    // Fetch dynamic thresholds from Firebase
    const res = await fetch(`${FIREBASE_DB_URL}/settings/thresholds.json`);
    const thresholds = await res.json();
    
    const tempDanger = thresholds?.tempDanger || 42;
    const gasDanger = thresholds?.gasDanger || 600;

    const details = log.details || "";
    
    // Ekstrak angka suhu/gas dari field "details"
    // Contoh log ESP32: "Kritis! Suhu: 36.5C, Kel: 70.0%" atau "Kebocoran! Gas: 850 PPM"
    const tempMatch = details.match(/Suhu:\s*([\d\.]+)/i);
    const gasMatch = details.match(/Gas:\s*([\d\.]+)/i);

    let message = `🚨 *ALARM RUANG SERVER* 🚨\n\n`;
    message += `Event: *${escapeMDV2(log.event || "Bahaya Terdeteksi")}*\n`;
    message += `Waktu: ${escapeMDV2(log.timestamp || new Date().toLocaleString())}\n\n`;

    let matchedSensor = false;

    if (tempMatch && tempMatch[1]) {
      const currentTemp = parseFloat(tempMatch[1]);
      message += `Suhu saat ini mencapai *${escapeMDV2(currentTemp.toString())}°C*\\!\n`;
      message += `Angka ini telah melewati batas Critical yang ditetapkan \\(*${escapeMDV2(tempDanger.toString())}°C*\\)\\.\n`;
      matchedSensor = true;
    }

    if (gasMatch && gasMatch[1]) {
      const currentGas = parseFloat(gasMatch[1]);
      message += `Kadar Gas saat ini mencapai *${escapeMDV2(currentGas.toString())} PPM*\\!\n`;
      message += `Angka ini sangat berbahaya dan melampaui batas \\(*${escapeMDV2(gasDanger.toString())} PPM*\\)\\.\n`;
      matchedSensor = true;
    }

    if (!matchedSensor) {
      // Jika bukan log sensor (misal log Intrusion/PIR)
      message += `Detail:\n_${escapeMDV2(details)}_\n`;
    }

    await sendTelegramAlert(message);

  } catch (e) {
    console.error("Error processing danger log:", e);
  }
}

// 2. Mekanisme Streaming (SSE) Firebase
async function startSSEListener() {
  console.log("📡 Terhubung ke Firebase RTDB Logs (SSE)...");
  
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/logs.json`, {
      headers: { "Accept": "text/event-stream" }
    });

    if (!response.body) throw new Error("Response body is null");
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = "";
    let isInitialLoad = true;
    let currentEvent = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.replace("event: ", "");
        } else if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.replace("data: ", "");
          if (dataStr === "null") continue;

          if (currentEvent === "put" || currentEvent === "patch") {
            try {
              const streamData = JSON.parse(dataStr);
              
              if (streamData.path === "/" && isInitialLoad) {
                isInitialLoad = false;
                console.log("✅ Riwayat log berhasil dilewati.");
                continue;
              }

              if (streamData.path !== "/") {
                const singleLog = streamData.data;
                if (singleLog && singleLog.type === "danger") {
                  console.log(`⚠️ Danger terdeteksi: ${singleLog.event}`);
                  await processDangerLog(singleLog);
                }
              } else {
                const logMap = streamData.data;
                if (logMap && typeof logMap === 'object') {
                  for (const key in logMap) {
                    const singleLog = logMap[key];
                    if (singleLog && singleLog.type === "danger") {
                      console.log(`⚠️ Danger terdeteksi: ${singleLog.event}`);
                      await processDangerLog(singleLog);
                    }
                  }
                }
              }
            } catch (err) {}
          }
        }
      }
    }
  } catch (error) {
    console.error("Firebase SSE Error:", error);
  }

  console.log("🔌 Koneksi terputus, mencoba ulang dalam 5 detik...");
  setTimeout(startSSEListener, 5000);
}

startSSEListener();

// 5. Route UI Testing
const app = new Elysia()
  .use(cors())
  .post("/api/notify", async ({ body, set }) => {
    const { message, level } = body as { message: string, level: string };
    
    let icon = "⚠️";
    if (level === "danger") {
      icon = "🚨";
    }

    // Hindari MarkdownV2 jika input sembarangan, kita fallback ke escape sederhana
    const escapedMsg = escapeMDV2(message || "");
    const text = `${icon} *CoreShield Security Alert*\n\n_${escapedMsg}_`;
    await sendTelegramAlert(text);

    set.status = 200;
    return { status: "success" };
  })
  .listen(8080);

console.log(`🚀 Menjalankan CoreShield Telegram Worker (Bun + Elysia)...`);
console.log(`✅ Backend aktif di http://${app.server?.hostname}:${app.server?.port}`);
