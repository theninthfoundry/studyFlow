import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Task, UserProfile, StudyLog, Subject, SubjectMaterial } from "./types";

const STORAGE_KEY = "student-todo:tasks:v1";
const NOTES_KEY = "student-todo:notes:v1";
const STREAK_KEY = "student-todo:streak:v1";
const SETTINGS_KEY = "student-todo:settings:v1";
const PROFILE_KEY = "student-todo:profile:v1";
const STUDY_LOGS_KEY = "student-todo:studylogs:v1";
const BUDGETS_KEY = "student-todo:budgets:v1";
const MATERIALS_KEY = "student-todo:materials:v1";
const GAMIFICATION_KEY = "student-todo:gamification:v1";

export interface GamificationData {
  xp: number;
  level: number;
  unlockedBadges: string[];
}

export const BADGES: Record<
  string,
  { title: string; description: string; icon: string; requirement: string }
> = {
  "first-task": {
    title: "First Step",
    description: "Completed your very first task in StudyFlow!",
    icon: "🎯",
    requirement: "Complete 1 task",
  },
  "streak-3": {
    title: "Streak Starter",
    description: "Maintained a 3-day study streak!",
    icon: "🔥",
    requirement: "Reach a 3-day streak",
  },
  "streak-7": {
    title: "Streak Master",
    description: "Maintained a 7-day study streak! Unstoppable!",
    icon: "⚡",
    requirement: "Reach a 7-day streak",
  },
  "tasks-10": {
    title: "Productivity Machine",
    description: "Completed 10 tasks! You are on fire!",
    icon: "🏆",
    requirement: "Complete 10 tasks",
  },
  "focus-1": {
    title: "Focus Knight",
    description: "Completed your first Pomodoro focus session!",
    icon: "🛡️",
    requirement: "Complete 1 focus session",
  },
  "focus-5": {
    title: "Deep Focus Sage",
    description: "Completed 5 deep focus sessions!",
    icon: "🧘",
    requirement: "Complete 5 focus sessions",
  },
  "planner": {
    title: "Planner Guru",
    description: "Scheduled a task or study log using the Weekly Planner!",
    icon: "📅",
    requirement: "Plan or update a task",
  },
};

const DEFAULT_GAMIFICATION: GamificationData = {
  xp: 0,
  level: 1,
  unlockedBadges: [],
};


export interface Settings {
  animations: boolean;
  dailyGoal: number;
}

const DEFAULT_SETTINGS: Settings = { animations: true, dailyGoal: 5 };

const DEFAULT_PROFILE: UserProfile = {
  name: "Aarav Sharma",
  email: "aarav@example.com",
  phone: "+91 98765 43210",
  branch: "Computer Science",
  className: "2nd Year",
};

const DEFAULT_BUDGETS: Record<Subject, number> = {
  Mathematics: 5,
  Physics: 5,
  Chemistry: 5,
  "Computer Science": 5,
  DSA: 5,
  English: 3,
  Electronics: 4,
  Other: 2,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  // Guard against prototype pollution attacks in raw strings
  if (raw.includes("__proto__") || raw.includes("constructor") || raw.includes("prototype")) {
    console.warn("[StudyFlow Firewall] Blocked potentially unsafe JSON structure.");
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  return safeParse<Task[]>(localStorage.getItem(STORAGE_KEY), []);
}
export function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw !== null) setState(safeParse<T>(raw, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state, hydrated]);

  return [state, setState, hydrated] as const;
}

export function useNotes() {
  return useLocalStorageState<string>(NOTES_KEY, "");
}

export function useSettings() {
  return useLocalStorageState<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

interface StreakData {
  current: number;
  lastActiveDate: string; // YYYY-MM-DD
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useStreak(tasks: Task[]) {
  const [streak, setStreak] = useLocalStorageState<StreakData>(STREAK_KEY, {
    current: 0,
    lastActiveDate: "",
  });

  const completedToday = useMemo(
    () =>
      tasks.filter((t) => t.completed && t.completedAt && t.completedAt.slice(0, 10) === todayStr())
        .length,
    [tasks],
  );

  useEffect(() => {
    if (completedToday === 0) return;
    const today = todayStr();
    if (streak.lastActiveDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    setStreak({
      current: streak.lastActiveDate === y ? streak.current + 1 : 1,
      lastActiveDate: today,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedToday]);

  return { streak: streak.current, completedToday };
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTasks(tasks);
  }, [tasks, hydrated]);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
  }, []);
  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const setAllTasks = useCallback((next: Task[]) => setTasks(next), []);

  return { tasks, hydrated, addTask, updateTask, deleteTask, setAllTasks };
}

export type ThemeMode = "light" | "dark" | "cyberpunk" | "emerald" | "sunset" | "ocean";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("student-todo:theme") as ThemeMode | null;
    const initial =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
  }, []);

  useEffect(() => {
    const classList = document.documentElement.classList;
    classList.remove("light", "dark", "cyberpunk", "emerald", "sunset", "ocean");
    classList.add(theme);

    // Toggle dark class for compatibility with general dark styles
    classList.toggle("dark", theme !== "light");

    localStorage.setItem("student-todo:theme", theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")),
  };
}

export function useProfile() {
  return useLocalStorageState<UserProfile>(PROFILE_KEY, DEFAULT_PROFILE);
}

export function useBudgets() {
  const [budgets, setBudgets, hydrated] = useLocalStorageState<Record<Subject, number>>(
    BUDGETS_KEY,
    DEFAULT_BUDGETS,
  );

  const updateBudget = useCallback(
    (subject: Subject, hours: number) => {
      setBudgets((prev) => ({
        ...prev,
        [subject]: hours,
      }));
    },
    [setBudgets],
  );

  return [budgets, updateBudget, hydrated] as const;
}

export function useStudyLogs() {
  const [studyLogs, setStudyLogs, hydrated] = useLocalStorageState<StudyLog[]>(STUDY_LOGS_KEY, []);

  const addStudyLog = useCallback(
    (log: StudyLog) => {
      setStudyLogs((prev) => [log, ...prev]);
    },
    [setStudyLogs],
  );

  const deleteStudyLog = useCallback(
    (id: string) => {
      setStudyLogs((prev) => prev.filter((log) => log.id !== id));
    },
    [setStudyLogs],
  );

  const setAllStudyLogs = useCallback(
    (next: StudyLog[]) => {
      setStudyLogs(next);
    },
    [setStudyLogs],
  );

  return { studyLogs, hydrated, addStudyLog, deleteStudyLog, setAllStudyLogs };
}

export function useSubjectMaterials() {
  const [materials, setMaterials, hydrated] = useLocalStorageState<SubjectMaterial[]>(
    MATERIALS_KEY,
    [],
  );

  const addMaterial = useCallback(
    (material: Omit<SubjectMaterial, "id" | "createdAt">) => {
      const newMaterial: SubjectMaterial = {
        ...material,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setMaterials((prev) => [newMaterial, ...prev]);
    },
    [setMaterials],
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    },
    [setMaterials],
  );

  return { materials, hydrated, addMaterial, deleteMaterial };
}

export function useGamification() {
  const [data, setData, hydrated] = useLocalStorageState<GamificationData>(
    GAMIFICATION_KEY,
    DEFAULT_GAMIFICATION,
  );

  const addXp = useCallback(
    (amount: number) => {
      setData((prev: GamificationData) => {
        const nextXp = prev.xp + amount;
        const nextLevel = Math.floor(nextXp / 500) + 1;

        if (nextLevel > prev.level) {
          setTimeout(() => {
            toast.success(`🎉 LEVEL UP! You reached Level ${nextLevel}!`, {
              description: "Keep up the fantastic work! 🚀",
              duration: 5000,
            });
          }, 500);
        }

        return {
          ...prev,
          xp: nextXp,
          level: nextLevel,
        };
      });
    },
    [setData],
  );

  const unlockBadge = useCallback(
    (badgeId: string) => {
      setData((prev: GamificationData) => {
        if (prev.unlockedBadges.includes(badgeId)) return prev;

        setTimeout(() => {
          const badge = BADGES[badgeId];
          toast.success(`🏆 BADGE UNLOCKED: ${badge?.title || badgeId}!`, {
            description: badge?.description || "",
            icon: badge?.icon || "🏆",
            duration: 6000,
          });
        }, 500);

        return {
          ...prev,
          unlockedBadges: [...prev.unlockedBadges, badgeId],
        };
      });
    },
    [setData],
  );

  return {
    xp: data.xp,
    level: data.level,
    unlockedBadges: data.unlockedBadges,
    addXp,
    unlockBadge,
    hydrated,
  };
}
