import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Key, Trash2, ArrowRight, Brain, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type Task, type StudyLog } from "@/lib/todo/types";
import { inspectPrompt, aiRateLimiter } from "@/lib/security/firewall";

interface Props {
  tasks: Task[];
  studyLogs: StudyLog[];
  streak: number;
}

interface Message {
  role: "user" | "model";
  content: string;
}

const TEMPLATES = [
  {
    id: "summary",
    title: "📅 Summarize My Progress",
    prompt: "Summarize my current study tasks, streak, and recent study logs. What subject should I focus on next?",
  },
  {
    id: "roadmap",
    title: "🚀 Design Exam Study Plan",
    prompt: "Help me design a study roadmap/plan for my high-priority tasks this week. Break them down step-by-step.",
  },
  {
    id: "breakdown",
    title: "💡 Break Down My Tasks",
    prompt: "Choose my most critical pending task and break it down into 5 actionable sub-steps.",
  },
  {
    id: "motivation",
    title: "☕ Motivation & Burnout Boost",
    prompt: "I am feeling burnt out or stuck. Give me some actionable advice and a study quote to recharge.",
  },
];

export function AIBuddy({ tasks, studyLogs, streak }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Hello! I am your AI Study Buddy. 🎓🤖\n\nI can analyze your study tasks, track your logs, and help you structure your study sessions. Provide your Google Gemini API Key below to activate real-time chats, or try the quick buttons below for a simulated analysis!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Load API Key
  useEffect(() => {
    const savedKey = localStorage.getItem("studyflow:gemini-key:v1");
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Please enter a valid key.");
      return;
    }
    localStorage.setItem("studyflow:gemini-key:v1", apiKey.trim());
    setIsKeySaved(true);
    toast.success("API Key saved successfully! Real AI mode is active.");
  };

  const handleClearKey = () => {
    localStorage.removeItem("studyflow:gemini-key:v1");
    setApiKey("");
    setIsKeySaved(false);
    toast.info("API Key removed. Switched back to simulation mode.");
  };

  // Generate simulated response based on user data
  const getSimulatedResponse = (prompt: string): string => {
    const pendingTasks = tasks.filter((t) => !t.completed);
    const highPriorityTasks = pendingTasks.filter((t) => t.priority === "high");
    const totalMinutes = studyLogs.reduce((acc, l) => acc + l.duration, 0);

    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("summarize") || lowerPrompt.includes("progress")) {
      return `📊 **StudyFlow Progress Summary**

- **Current Streak:** ${streak} days 🔥
- **Pending Tasks:** ${pendingTasks.length} task(s)
- **High Priority Tasks:** ${highPriorityTasks.length} remaining
- **Total Study Hours Logged:** ${Math.round((totalMinutes / 60) * 10) / 10} hours (${totalMinutes} minutes)

**Recommendations:**
1. You have ${highPriorityTasks.length} high priority task(s) outstanding. Focus on completing these first.
2. Math & Computer Science appear regularly in your schedule. Try to dedicate a 25-minute Pomodoro slot today to maintain your streak!`;
    }

    if (lowerPrompt.includes("roadmap") || lowerPrompt.includes("exam")) {
      if (pendingTasks.length === 0) {
        return "✨ **Weekly Roadmap Plan**\n\nFantastic job! You currently have no pending tasks. Take this time to read ahead in your textbooks, compile cheatsheets, or do some light revision. Remember: resting is part of the roadmap! ☕";
      }
      const roadmapItems = pendingTasks
        .slice(0, 3)
        .map((t, idx) => `${idx + 1}. **${t.title}** (${t.subject}) - Priority: ${t.priority.toUpperCase()}`);
      return `🚀 **Study Roadmap & Plan**

Here is a recommended schedule to tackle your next tasks:

**Phase 1: High Focus (25m sessions)**
${roadmapItems.join("\n")}

**Step-by-Step Execution:**
- **Set a timer:** Work on Item 1 for 25 minutes using the Focus tab.
- **Short Break:** Relax for 5 minutes, drink some water.
- **Repeat:** Spend the next block on Item 2.
- Keep logs updated so you can track your study budgets!`;
    }

    if (lowerPrompt.includes("break") || lowerPrompt.includes("actionable")) {
      if (pendingTasks.length === 0) {
        return "You don't have any pending tasks to break down right now! Try creating a task first.";
      }
      const primaryTask = pendingTasks[0];
      return `💡 **Task Breakdown: "${primaryTask.title}"**

To make this task less intimidating, here is a 5-step breakdown:

1. **Information Gathering (5 mins):** Open all documents, lecture slides, or textbooks related to *${primaryTask.subject}*.
2. **Drafting / Structuring (10 mins):** Write down the outline or core requirements of the task.
3. **Deep Work Block 1 (25 mins):** Focus entirely on writing the first section or solving the first half of the problems.
4. **Review & Refine (10 mins):** Edit what you've done, checking for errors or omissions.
5. **Final Submission check (5 mins):** Save, format properly, and mark complete in StudyFlow!`;
    }

    if (lowerPrompt.includes("motivation") || lowerPrompt.includes("quote") || lowerPrompt.includes("burnout")) {
      const quotes = [
        "\"The secret of getting ahead is getting started.\" — Mark Twain",
        "\"It always seems impossible until it's done.\" — Nelson Mandela",
        "\"Focus on being productive instead of busy.\" — Tim Ferriss",
      ];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      return `☕ **Beat Burnout & Refuel**

It is completely normal to feel fatigued. Studying is a marathon, not a sprint. Here are 3 quick tips to recharge:

1. **Change your environment:** Take a 10-minute walk outside or move to a different room.
2. **The 5-Minute Rule:** Tell yourself you will work for just 5 minutes. If you want to stop after that, you can. (Usually, you will want to keep going!)
3. **Mix Soundscapes:** Head to the Focus tab, turn on Rain + Lofi Beats at low volumes, and just close your eyes for a bit.

**Your quote for today:**
> ${randomQuote}`;
    }

    return "🤖 *You are running in Simulated Mode.*\n\nTo chat freely and ask custom questions (e.g. explaining complex topics, writing essays, or debugging code), please enter your Google Gemini API Key below. It runs client-side securely!";
  };

  const handleSend = async (textToSend?: string) => {
    const rawMessageText = textToSend || input;
    if (!rawMessageText.trim()) return;

    // Rate Limiting Check
    if (!aiRateLimiter.tryConsume()) {
      const waitSec = aiRateLimiter.waitTimeSeconds();
      toast.warning(`Rate limit reached. Please wait ${waitSec}s before sending another prompt.`);
      return;
    }

    // Prompt Security Firewall Inspection
    const firewallResult = inspectPrompt(rawMessageText);
    if (!firewallResult.isSafe) {
      toast.error(`Security Guard Blocked Input: ${firewallResult.reason}`);
      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "model",
          content: `⚠️ **Security Guard Warning:** Prompt request was blocked.\n\n*Reason:* ${firewallResult.reason}`,
        },
      ]);
      return;
    }

    const messageText = firewallResult.sanitized;

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: messageText }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    if (!isKeySaved) {
      // Simulation mode delay
      setTimeout(() => {
        const simResponse = getSimulatedResponse(messageText);
        setMessages((prev: Message[]) => [...prev, { role: "model" as const, content: simResponse }]);
        setLoading(false);
      }, 800);
      return;
    }

    // Call Gemini API
    try {
      const formattedTasks = tasks.map((t) => ({
        title: t.title,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        completed: t.completed,
        dueDate: t.dueDate,
      }));

      const formattedLogs = studyLogs.slice(0, 10).map((l) => ({
        subject: l.subject,
        duration: l.duration,
        date: l.date,
      }));

      const contextString = `You are a helpful and motivational AI Study Buddy in the StudyFlow app.
The student's details:
- Streak: ${streak} days
- Tasks Database: ${JSON.stringify(formattedTasks)}
- Recent Study Logs: ${JSON.stringify(formattedLogs)}

Always give practical, clear, structured study tips. Use markdown, emojis, bullet points, and highlight tasks by title. Keep answers supportive and relatively concise.`;

      // API call to Gemini 1.5 Flash
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `${contextString}\n\nStudent asks: ${messageText}`,
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to contact Gemini API. Please check your API Key.");
      }

      const data = await response.json();
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I received an empty response. Please try again.";

      setMessages((prev: Message[]) => [...prev, { role: "model" as const, content: responseText }]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred.");
      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "model" as const,
          content: "❌ **Error connection failed.**\n\nCould not reach Gemini. Please verify that your API key is correct and you have an active internet connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* Left Column: Chat Room */}
      <div className="glass rounded-3xl border border-border/60 p-4 flex flex-col h-[650px] shadow-soft">
        <div className="flex items-center justify-between border-b border-border/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">AI Study Buddy</h3>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/20 font-medium">
                  <ShieldCheck className="h-3 w-3" /> Shield Active
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold">
                {isKeySaved ? "🟢 Active via Gemini 1.5 Flash" : "🟡 Simulation Mode"}
              </p>
            </div>
          </div>
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-3 scrollbar-thin">
          {messages.map((m: Message, idx: number) => {
            const isAI = m.role === "model";
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-2.5",
                  isAI ? "justify-start" : "justify-end",
                )}
              >
                {isAI && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-primary/15 border border-primary/25 text-primary shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl p-3.5 text-sm whitespace-pre-wrap leading-relaxed shadow-sm",
                    isAI
                      ? "bg-card border border-border/50 text-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none font-medium",
                  )}
                >
                  {m.content}
                </div>
                {!isAI && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-secondary border border-border/40 text-foreground text-xs font-bold font-display shadow-sm">
                    ME
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl bg-primary/15 border border-primary/25 text-primary shadow-sm">
                <Sparkles className="h-3.5 w-3.5 animate-spin duration-3000" />
              </div>
              <div className="bg-card border border-border/50 text-foreground rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1.5 shadow-sm">
                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion templates */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSend(t.prompt)}
                className="text-left p-2.5 rounded-xl border border-border/50 bg-card/65 text-xs hover:border-primary hover:bg-primary/5 transition font-semibold text-foreground cursor-pointer flex items-center justify-between"
              >
                <span>{t.title}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Input panel */}
        <div className="flex items-center gap-2 border-t border-border/10 pt-3">
          <Input
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
            placeholder="Ask your study buddy anything..."
            className="flex-1 rounded-xl h-10 border-border/60 text-xs bg-background/50"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            className="h-10 w-10 rounded-xl cursor-pointer"
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right Column: Key settings */}
      <div className="space-y-4">
        <div className="glass rounded-3xl border border-border/60 p-5 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Key className="h-4 w-4 text-primary" />
            <span>Gemini API Key</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Get a free Gemini API Key from{" "}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-primary font-bold hover:underline"
            >
              Google AI Studio
            </a>
            . Paste it below to enable custom open-ended questions about your syllabus, homework, or revisions.
          </p>

          {isKeySaved ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-xs text-success font-semibold flex items-center justify-between">
                <span>🔑 Key Active</span>
                <button
                  onClick={handleClearKey}
                  className="text-muted-foreground hover:text-destructive p-1 rounded transition cursor-pointer"
                  title="Remove Key"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveKey} className="space-y-2">
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                className="text-xs rounded-xl"
              />
              <Button type="submit" className="w-full text-xs rounded-xl font-bold cursor-pointer">
                Save API Key
              </Button>
            </form>
          )}
        </div>

        <div className="glass rounded-3xl border border-border/60 p-5 shadow-soft space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What is local AI mode?
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your key is stored **only** locally on your device in your browser's private localStorage. It is sent directly to Google Gemini's server endpoints, meaning no third party ever sees your credential.
          </p>
        </div>
      </div>
    </div>
  );
}
