import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Link2,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  BookOpen,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECTS, SUBJECT_COLORS, type Subject, type SubjectMaterial } from "@/lib/todo/types";
import { safeUrl } from "@/lib/security/sanitizer";
import { inspectInput } from "@/lib/security/firewall";

interface Props {
  materials: SubjectMaterial[];
  onAddMaterial: (material: Omit<SubjectMaterial, "id" | "createdAt">) => void;
  onDeleteMaterial: (id: string) => void;
}

export function ResourcesPanel({ materials, onAddMaterial, onDeleteMaterial }: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetSubject, setTargetSubject] = useState<Subject>("Computer Science");
  const [selectedMaterial, setSelectedMaterial] = useState<SubjectMaterial | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "link" as "link" | "note" | "image",
    value: "",
  });

  const handleOpenAdd = (subject: Subject) => {
    setTargetSubject(subject);
    setForm({
      title: "",
      type: "link",
      value: "",
    });
    setIsAddOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress image to 70% quality JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setForm((prev: typeof form) => ({ ...prev, value: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleCheck = inspectInput(form.title);
    if (!titleCheck.isSafe) {
      toast.error(`Security Warning: ${titleCheck.reason}`);
      return;
    }

    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!form.value.trim()) {
      if (form.type === "image") {
        toast.error("Please upload an image file");
      } else {
        toast.error("Please enter a link or note content");
      }
      return;
    }

    let finalValue = form.value.trim();
    if (form.type === "link") {
      if (!/^https?:\/\//i.test(finalValue)) {
        finalValue = "https://" + finalValue;
      }
      const sanitizedUrl = safeUrl(finalValue, "");
      if (!sanitizedUrl) {
        toast.error("Invalid or unsafe URL format");
        return;
      }
      finalValue = sanitizedUrl;
    }

    onAddMaterial({
      subject: targetSubject,
      title: titleCheck.sanitized,
      type: form.type,
      value: finalValue,
    });

    setIsAddOpen(false);
    toast.success(`Resource added to ${targetSubject}!`);
  };

  const totalResources = materials.length;

  return (
    <div className="space-y-6">
      {/* Overview stats header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Study Resources Hub</h3>
            <p className="text-xs text-muted-foreground">
              A central repository for your bookmarks, study files, and course notes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground border border-border/80">
            Total Resources: {totalResources}
          </span>
          <Button
            size="sm"
            onClick={() => handleOpenAdd("Computer Science")}
            className="gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow cursor-pointer h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Resource
          </Button>
        </div>
      </div>

      {totalResources === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-dashed border-border/80 bg-card/25 p-12 text-center flex flex-col items-center justify-center min-h-[300px]"
        >
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground border border-border/60">
            <BookOpen className="h-7 w-7" />
          </div>
          <h4 className="text-base font-semibold text-foreground">No resources cataloged</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Quickly organize lecture notes, syllabuses, cheat-sheets, or links below. Attach them to
            their respective subjects to keep them organized.
          </p>
          <Button
            onClick={() => handleOpenAdd("Computer Science")}
            className="mt-5 gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow cursor-pointer h-9 px-4 text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Your First Resource
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((s, idx) => {
            const subjectMaterials = materials.filter((m) => m.subject === s);
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass rounded-2xl p-4 shadow-soft flex flex-col justify-between border border-border/60 hover:border-primary/45 transition duration-200"
              >
                <div className="space-y-4">
                  {/* Subject Title Header */}
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${SUBJECT_COLORS[s]}`}
                    >
                      {s}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {subjectMaterials.length} items
                    </span>
                  </div>

                  {/* List of items */}
                  <div className="space-y-2 min-h-[120px] max-h-[200px] overflow-y-auto pr-1">
                    {subjectMaterials.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <p className="text-[11px] text-muted-foreground italic">
                          No links or notes logged.
                        </p>
                      </div>
                    ) : (
                      subjectMaterials.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMaterial(m)}
                          className="group flex items-start justify-between gap-2 rounded-xl bg-secondary/20 border border-border/30 p-2 hover:bg-secondary/40 transition cursor-pointer"
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="mt-0.5 p-1 rounded bg-secondary/80 text-foreground shrink-0">
                              {m.type === "link" ? (
                                <Link2 className="h-3.5 w-3.5 text-primary" />
                              ) : m.type === "image" ? (
                                <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-xs font-semibold text-foreground truncate max-w-[150px] group-hover:text-primary transition-colors"
                                title={m.title}
                              >
                                {m.title}
                              </p>
                              {m.type === "link" ? (
                                <span className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 truncate max-w-[140px] mt-0.5 font-medium">
                                  Open URL
                                  <ExternalLink className="h-2 w-2" />
                                </span>
                              ) : m.type === "image" ? (
                                <span className="text-[10px] text-emerald-500 hover:underline inline-flex items-center gap-0.5 truncate max-w-[140px] mt-0.5 font-medium">
                                  View Photo
                                </span>
                              ) : (
                                <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[160px] leading-snug mt-0.5">
                                  {m.value}
                                </p>
                              )}
                            </div>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMaterial(m.id);
                              toast.success("Resource removed");
                            }}
                            className="h-6 w-6 rounded hover:text-destructive text-muted-foreground hover:bg-secondary/70 shrink-0 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add resource action */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAdd(s)}
                  className="w-full mt-4 rounded-xl text-xs h-8 cursor-pointer border-border/70 hover:border-primary/60"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Resource
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl glass">
          <DialogHeader>
            <DialogTitle>Add Study Resource</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a link, cheat-sheet note, or photo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-semibold">
                Resource Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. CS Lab Syllabus, Cheatsheet PDF"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) =>
                    setForm({ ...form, type: val as "link" | "note" | "image", value: "" })
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-border/50">
                    <SelectItem value="link" className="cursor-pointer">
                      🔗 Web Link / URL
                    </SelectItem>
                    <SelectItem value="note" className="cursor-pointer">
                      📝 Cheat-Sheet Note
                    </SelectItem>
                    <SelectItem value="image" className="cursor-pointer">
                      📷 Media / Photo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="val" className="text-xs font-semibold">
                {form.type === "link"
                  ? "Link / URL"
                  : form.type === "note"
                    ? "Cheat-Sheet notes"
                    : "Upload Media / Photo"}
              </Label>
              {form.type === "link" ? (
                <Input
                  id="val"
                  placeholder="e.g. drive.google.com/..."
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                  className="h-9"
                />
              ) : form.type === "note" ? (
                <Textarea
                  id="val"
                  placeholder="Enter exam schedule, pointers, equations, or cheat sheet notes..."
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                  className="min-h-[80px] max-h-[160px]"
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    id="val"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!form.value}
                    className="h-9 cursor-pointer text-xs pt-1.5"
                  />
                  {form.value && (
                    <div className="relative mt-2 rounded-xl border border-border/50 p-1.5 bg-secondary/15 flex items-center justify-center max-h-[120px] overflow-hidden">
                      <img
                        src={form.value}
                        alt="Preview"
                        className="max-h-[100px] object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="subject" className="text-xs font-semibold">
                Add to Subject / Section
              </Label>
              <Select
                value={targetSubject}
                onValueChange={(val) => setTargetSubject(val as Subject)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-border/50">
                  {SUBJECTS.map((sub) => (
                    <SelectItem key={sub} value={sub} className="cursor-pointer">
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow cursor-pointer"
              >
                Save Resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!selectedMaterial} onOpenChange={(open) => !open && setSelectedMaterial(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl glass max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  selectedMaterial ? SUBJECT_COLORS[selectedMaterial.subject] : ""
                }`}
              >
                {selectedMaterial?.subject}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {selectedMaterial ? new Date(selectedMaterial.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold font-display mt-2 flex items-center gap-2">
              {selectedMaterial?.type === "link" && <Link2 className="h-5 w-5 text-primary" />}
              {selectedMaterial?.type === "note" && <FileText className="h-5 w-5 text-amber-500" />}
              {selectedMaterial?.type === "image" && (
                <ImageIcon className="h-5 w-5 text-emerald-500" />
              )}
              {selectedMaterial?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {selectedMaterial?.type === "note" && (
              <div className="rounded-xl border border-border bg-secondary/15 p-4 whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono">
                {selectedMaterial.value}
              </div>
            )}

            {selectedMaterial?.type === "image" && (
              <div className="rounded-xl border border-border bg-secondary/15 p-2 flex flex-col items-center justify-center">
                <img
                  src={selectedMaterial.value}
                  alt={selectedMaterial.title}
                  className="max-h-[50vh] object-contain rounded-lg w-full"
                />
              </div>
            )}

            {selectedMaterial?.type === "link" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This is a web link. You can open it in a new tab:
                </p>
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-secondary/15">
                  <span className="text-xs text-primary truncate max-w-[320px]">
                    {selectedMaterial.value}
                  </span>
                  <a
                    href={selectedMaterial.value}
                    target="_blank"
                    rel="noreferrer"
                    className="gradient-primary text-primary-foreground font-semibold rounded-xl shadow-glow cursor-pointer text-xs px-3 py-1.5 inline-flex items-center gap-1 shrink-0"
                  >
                    Go to URL
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
            {selectedMaterial && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDeleteMaterial(selectedMaterial.id);
                  setSelectedMaterial(null);
                  toast.success("Resource removed");
                }}
                className="rounded-xl cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Delete Resource
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setSelectedMaterial(null)}
              className="rounded-xl cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
