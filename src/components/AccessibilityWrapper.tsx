import { useState, useEffect } from "react";
import { Eye, EyeOff, Volume2, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: number;
  animations: boolean;
  screenReader: boolean;
}

export function AccessibilityWrapper({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: 100,
    animations: true,
    screenReader: false,
  });

  const [open, setOpen] = useState(false);

  const applySettings = () => {
    document.documentElement.style.setProperty('--font-scale', `${settings.fontSize / 100}`);
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('no-animations', !settings.animations);
    document.documentElement.classList.toggle('screen-reader-mode', settings.screenReader);
  };

  useEffect(() => {
    applySettings();
  }, [settings]);

  return (
    <TooltipProvider>
      <div className={`accessibility-wrapper ${settings.highContrast ? 'high-contrast' : ''} ${!settings.animations ? 'no-animations' : ''} ${settings.screenReader ? 'screen-reader-mode' : ''}`}>
        <div className="fixed top-4 right-4 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(!open)}
                aria-label="Accessibility settings"
                className="rounded-full shadow-lg"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              Accessibility Settings
            </TooltipContent>
          </Tooltip>
        </div>

        {open && (
          <Card className="fixed top-20 right-4 z-50 w-80 shadow-xl border-border">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Accessibility</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="high-contrast" className="text-xs font-medium">High Contrast</Label>
                  <p className="text-xs text-muted-foreground">Enhanced color contrast</p>
                </div>
                <Switch id="high-contrast" checked={settings.highContrast} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, highContrast: checked }))} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="font-size" className="text-xs font-medium">Font Size</Label>
                  <span className="text-xs text-muted-foreground">{settings.fontSize}%</span>
                </div>
                <Slider id="font-size" min={80} max={150} step={5} value={[settings.fontSize]} onValueChange={(value) => setSettings(prev => ({ ...prev, fontSize: value[0] }))} className="w-full" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="animations" className="text-xs font-medium">Animations</Label>
                  <p className="text-xs text-muted-foreground">Reduce motion</p>
                </div>
                <Switch id="animations" checked={settings.animations} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, animations: checked }))} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="screen-reader" className="text-xs font-medium">Screen Reader</Label>
                  <p className="text-xs text-muted-foreground">Enhanced navigation</p>
                </div>
                <Switch id="screen-reader" checked={settings.screenReader} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, screenReader: checked }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSettings({ highContrast: false, fontSize: 100, animations: true, screenReader: false })} className="flex-1 text-xs">Reset</Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1 text-xs">Close</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:p-2 focus:rounded focus:z-50">
          Skip to content
        </a>

        <main id="main-content">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
