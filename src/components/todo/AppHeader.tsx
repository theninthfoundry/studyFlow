import { Palette, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ThemeMode } from "@/lib/todo/storage";

interface AppHeaderProps {
  scrollToHome: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  initials: string;
  onOpenProfile: () => void;
  level?: number;
  xp?: number;
}

export function AppHeader({
  scrollToHome,
  theme,
  setTheme,
  initials,
  onOpenProfile,
  level = 1,
  xp = 0,
}: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={scrollToHome}
          className="min-w-0 text-left transition hover:opacity-90 flex items-center gap-2"
          aria-label="Go to home"
        >
          <div className="flex items-center gap-1 text-2xl tracking-tight">
            <span className="font-semibold text-foreground">Study</span>
            <span className="font-bold text-primary">Flow</span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
            <ShieldCheck className="h-3 w-3" /> Encrypted & Shielded
          </span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {/* Level and XP indicator */}
        <div className="hidden items-center gap-2.5 rounded-full border border-border/70 bg-card/85 px-3 py-1.5 shadow-sm sm:flex">
          <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            ⚡
          </div>
          <div className="text-left leading-none">
            <p className="text-xs font-bold text-foreground">Lvl {level}</p>
            <div className="mt-1.5 h-1 w-20 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-sky-500 transition-all duration-500"
                style={{ width: `${(xp % 500) / 5}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
            {xp % 500} / 500 XP
          </span>
        </div>

        {/* Paintbrush Theme Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              title="Change Theme"
              className="h-9 w-9 rounded-full border-border/70 bg-card/80 shadow-sm transition hover:border-primary hover:text-primary hover:bg-card cursor-pointer"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-xl glass p-1.5 shadow-lg border border-border/50"
          >
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition hover:bg-secondary/60",
                theme === "dark" && "bg-primary/10 text-primary",
              )}
            >
              🌙 Midnight Default
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("cyberpunk")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition hover:bg-secondary/60",
                theme === "cyberpunk" && "bg-primary/10 text-primary",
              )}
            >
              🧪 Cyberpunk Neon
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("emerald")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition hover:bg-secondary/60",
                theme === "emerald" && "bg-primary/10 text-primary",
              )}
            >
              🌲 Emerald Sage
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("sunset")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition hover:bg-secondary/60",
                theme === "sunset" && "bg-primary/10 text-primary",
              )}
            >
              🌅 Sunset Breeze
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("ocean")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition hover:bg-secondary/60",
                theme === "ocean" && "bg-primary/10 text-primary",
              )}
            >
              🌊 Deep Ocean
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition hover:bg-secondary/60",
                theme === "light" && "bg-primary/10 text-primary",
              )}
            >
              ☀ Light Aura
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={onOpenProfile}
          title="Profile & Settings"
          aria-label="Profile and settings"
          className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-sm transition hover:border-primary hover:bg-card cursor-pointer"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-500 text-sm font-semibold text-white">
            {initials}
          </div>
          <span className="text-sm font-medium text-foreground">Profile</span>
        </button>
      </div>
    </header>
  );
}
