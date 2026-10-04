import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPwaPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));

    if (isStandalone) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  };

  if (!visible || !installEvent) return null;

  return (
    <div className="fixed inset-x-3 bottom-[5.5rem] z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-primary/30 bg-card/95 p-3 shadow-lg backdrop-blur-md lg:bottom-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Download aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Install Vastraveda</p>
          <p className="text-xs text-muted-foreground">Add the app to your home screen</p>
        </div>
      </div>
      <Button size="sm" onClick={handleInstall}>Install</Button>
      <Button variant="ghost" size="icon" aria-label="Dismiss install prompt" onClick={() => setVisible(false)}>
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

export default InstallPwaPrompt;

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };
void (undefined as unknown as NavigatorWithStandalone);

declare global {
  interface Window {
    __pwaPromptReady?: boolean;
  }
}

interface PwaWindow extends Window {}
void (window as PwaWindow);
