import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Send, Eye, EyeOff, CheckCircle2, Loader2, Thermometer, Wind, ShieldAlert, DoorOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ref, get, set } from "firebase/database";
import { db } from "@/lib/firebase";

interface TelegramConfig {
  botToken: string;
  chatId: string;
  triggers: {
    highTemperature: boolean;
    gasSmoke: boolean;
    frontDoorLoitering: boolean;
    backDoorPir: boolean;
  };
}

const TRIGGERS = [
  {
    key: "highTemperature" as const,
    label: "High Temperature Warning",
    description: "DHT22 exceeds the warning threshold",
    icon: Thermometer,
  },
  {
    key: "gasSmoke" as const,
    label: "Gas / Smoke Detection",
    description: "MQ2 detects gas or smoke above danger level",
    icon: Wind,
  },
  {
    key: "frontDoorLoitering" as const,
    label: "Front Door Intrusion",
    description: "Ultrasonic sensor detects presence > 15 seconds",
    icon: ShieldAlert,
  },
  {
    key: "backDoorPir" as const,
    label: "Back Door Opened",
    description: "PIR sensor detects motion at back door",
    icon: DoorOpen,
  },
];

export function TelegramSettings() {
  const { toast } = useToast();

  const [config, setConfig] = useState<TelegramConfig>({
    botToken: "",
    chatId: "",
    triggers: {
      highTemperature: true,
      gasSmoke: true,
      frontDoorLoitering: true,
      backDoorPir: false,
    },
  });

  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const telegramRef = ref(db, 'settings/telegram');
    get(telegramRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setConfig({
          botToken: data.botToken || "",
          chatId: data.chatId || "",
          triggers: {
            highTemperature: data.triggers?.highTemperature ?? true,
            gasSmoke: data.triggers?.gasSmoke ?? true,
            frontDoorLoitering: data.triggers?.frontDoorLoitering ?? true,
            backDoorPir: data.triggers?.backDoorPir ?? false,
          }
        });
      }
    }).catch((error) => {
      console.error("Failed to fetch telegram settings:", error);
    });
  }, []);

  const handleTriggerChange = (key: keyof TelegramConfig["triggers"], value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      triggers: { ...prev.triggers, [key]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const telegramRef = ref(db, 'settings/telegram');
      await set(telegramRef, config);
      toast({
        title: "Settings Saved",
        description: "Telegram integration configuration has been saved to Firebase.",
      });
    } catch {
      toast({
        title: "Save Failed",
        description: "Could not save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      if (!config.botToken || !config.chatId) {
        throw new Error("Bot Token and Chat ID are required.");
      }

      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: "✅ Koneksi CoreShield ke Telegram berhasil! Sistem siap memantau."
        })
      });

      if (!response.ok) {
        throw new Error("Invalid Token or Chat ID");
      }

      toast({
        title: "Test Message Sent",
        description: "A test notification was delivered to your Telegram chat.",
      });
    } catch (err) {
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Could not reach Telegram. Check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = config.botToken.trim() !== "" && config.chatId.trim() !== "";

  return (
    <Card className="p-6 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/15">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Telegram Integration</h3>
            <p className="text-sm text-muted-foreground">Send real-time alerts to a Telegram bot.</p>
          </div>
        </div>
        {isConfigured && (
          <div className="flex items-center gap-1.5 text-sm text-chart-4 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Configured
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="bot-token" className="font-semibold">
              Bot API Token
            </Label>
            <div className="relative">
              <Input
                id="bot-token"
                type={showToken ? "text" : "password"}
                placeholder="110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"
                value={config.botToken}
                onChange={(e) => setConfig((p) => ({ ...p, botToken: e.target.value }))}
                className="pr-10 bg-background border-border font-mono text-sm"
                data-testid="input-telegram-bot-token"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showToken ? "Hide token" : "Show token"}
                data-testid="btn-toggle-token-visibility"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Obtain from{" "}
              <span className="text-primary font-mono">@BotFather</span> on Telegram.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chat-id" className="font-semibold">
              Chat ID / Group ID
            </Label>
            <Input
              id="chat-id"
              type="text"
              placeholder="-1001234567890"
              value={config.chatId}
              onChange={(e) => setConfig((p) => ({ ...p, chatId: e.target.value }))}
              className="bg-background border-border font-mono text-sm"
              data-testid="input-telegram-chat-id"
            />
            <p className="text-xs text-muted-foreground">
              Use a negative ID for groups (e.g.{" "}
              <span className="font-mono">-100...</span>).
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Notification Triggers */}
        <div className="space-y-4">
          <Label className="text-base font-bold">Notification Triggers</Label>
          <p className="text-sm text-muted-foreground -mt-2">
            Choose which CoreShield events send a Telegram alert.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRIGGERS.map(({ key, label, description, icon: Icon }) => (
              <div
                key={key}
                className={`flex items-start justify-between gap-4 p-4 rounded-lg border transition-colors ${
                  config.triggers[key]
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-background"
                }`}
                data-testid={`trigger-row-${key}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                      config.triggers[key]
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
                  </div>
                </div>
                <Switch
                  checked={config.triggers[key]}
                  onCheckedChange={(v) => handleTriggerChange(key, v)}
                  className="shrink-0 mt-0.5"
                  data-testid={`switch-trigger-${key}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground max-w-sm">
            Credentials are securely synced with your Firebase Realtime Database.
          </p>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || isSaving || !isConfigured}
              className="border-border"
              data-testid="btn-test-telegram"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isTesting ? "Sending…" : "Test Connection"}
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || isTesting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6"
              data-testid="btn-save-telegram"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
