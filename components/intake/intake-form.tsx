"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  FileText,
  Pencil,
  Sparkles,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useSessionStore } from "@/lib/store/use-session-store";
import { mockClarifyingQuestions } from "@/lib/mock-data";
import { api, ApiClientError, USE_MOCKS } from "@/lib/api/client";
import { toast } from "sonner";
import {
  AnalyzeProgress,
  GenerateProgress,
} from "@/components/ai/generate-progress";
import { ClarifyingQuestions } from "@/components/intake/clarifying-questions";
import { useGenerationStore } from "@/lib/generation/session-generation";
import {
  getExamBlueprint,
  listExamPresetsByProvider,
  mapWeakTopicsToDomains,
  parseMasteryTopicKey,
} from "@/lib/exams";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ClarifyingQuestion } from "@/types";
import { cn } from "@/lib/utils";

const intakeSchema = z.object({
  description: z
    .string()
    .min(
      15,
      "Tell us a bit more about your exam and weak areas (15+ characters).",
    ),
});

type IntakeValues = z.infer<typeof intakeSchema>;

const EXAMPLE_PROMPTS = [
  "I'm taking the AWS SAA-C03 exam and I'm weak in networking and security.",
  "Azure AZ-900 fundamentals — I keep mixing up storage tiers.",
  "Google Cloud Associate Engineer, focus on IAM and VPCs.",
];

const SESSION_SIZE_PRESETS = [5, 10, 15, 20] as const;

const DIFFICULTY_OPTIONS = [
  { value: "mixed", label: "Mixed" },
  { value: "easier", label: "Easier" },
  { value: "harder", label: "Harder" },
] as const;

type DifficultyChoice = (typeof DIFFICULTY_OPTIONS)[number]["value"];

const DRAFT_KEY = "prepa-intake-draft";
/** Last-used session settings, restored as defaults on the next visit. */
const DEFAULTS_KEY = "prepa-intake-defaults";

interface IntakeDraft {
  description?: string;
  presetCode?: string | null;
  questionCount?: number;
  difficulty?: DifficultyChoice;
}

function OptionChip({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {children}
    </button>
  );
}

const STEPS = ["Describe", "Customize", "Generate"] as const;

function StepIndicator({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Intake steps">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/15 text-primary ring-1 ring-primary/40",
                !done && !active && "bg-secondary text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px flex-1",
                  done ? "bg-primary/50" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

type Phase = "describe" | "analyzing" | "customize" | "generating";

interface IntakeFormProps {
  initialTopic?: string;
  initialExamCode?: string;
}

export function IntakeForm({
  initialTopic,
  initialExamCode,
}: IntakeFormProps = {}) {
  const router = useRouter();
  const remaining = useSessionStore((s) => s.remainingFreeQuestions());
  const topicMastery = useSessionStore((s) => s.topicMastery);
  const hydrate = useSessionStore((s) => s.hydrate);

  const [phase, setPhase] = useState<Phase>("describe");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | undefined>();
  const [clarifying, setClarifying] = useState<ClarifyingQuestion[]>(
    USE_MOCKS ? mockClarifyingQuestions : [],
  );
  const [clarificationAnswers, setClarificationAnswers] = useState<
    Record<string, string>
  >({});
  /** The description that produced the current clarifying questions. */
  const [analyzedDescription, setAnalyzedDescription] = useState<string | null>(
    null,
  );
  const [analyzeStatus, setAnalyzeStatus] = useState(
    "Analyzing your exam goals…",
  );
  const [generateStatus, setGenerateStatus] = useState(
    "Generating exam-style questions…",
  );
  const [generateMeta, setGenerateMeta] = useState<{
    exam?: string;
    examCode?: string;
    focusTopics?: string[];
  }>({});
  const [questionPreviews, setQuestionPreviews] = useState<string[]>([]);
  const [completedQuestions, setCompletedQuestions] = useState(0);
  const [isClarifyStreaming, setIsClarifyStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyChoice>("mixed");
  const [selectedPresetCode, setSelectedPresetCode] = useState<string | null>(
    null,
  );
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [timedPractice, setTimedPractice] = useState(false);
  const [practiceMinutes, setPracticeMinutes] = useState(15);
  const clarifyAbortRef = useRef<AbortController | null>(null);
  const presetGroups = listExamPresetsByProvider();
  // remaining is Infinity on unlimited tiers, so min() handles every plan.
  const maxQuestions = Math.min(20, remaining);
  const selectedPreset = selectedPresetCode
    ? presetGroups
        .flatMap((g) => g.presets)
        .find((p) => p.examCode === selectedPresetCode)
    : undefined;

  const adaptiveFocusDomainIds = useMemo(() => {
    if (!adaptiveEnabled || !selectedPreset) return undefined;
    const blueprint = getExamBlueprint(selectedPreset.examCode);
    if (!blueprint) return undefined;
    const relevant = topicMastery.filter((t) => {
      const parsed = parseMasteryTopicKey(t.topic);
      if (!parsed) return true;
      return parsed.examCode.toUpperCase() === blueprint.examCode.toUpperCase();
    });
    const weakest = [...relevant]
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3);
    if (weakest.length === 0) return undefined;
    return mapWeakTopicsToDomains(
      blueprint,
      weakest.map((t) => t.topic),
    ).map((d) => d.id);
  }, [adaptiveEnabled, selectedPreset, topicMastery]);

  const form = useForm<IntakeValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: { description: "" },
    mode: "onChange",
  });

  const description =
    useWatch({ control: form.control, name: "description" }) ?? "";

  useEffect(() => {
    if (!initialTopic) return;
    const prefill = initialExamCode
      ? `I'm studying for ${initialExamCode} and want focused practice on ${initialTopic}. Generate exam-style questions on this topic.`
      : `I want focused practice on ${initialTopic}. Generate exam-style questions on this topic.`;
    form.setValue("description", prefill, { shouldValidate: true });
  }, [initialTopic, initialExamCode, form]);

  // Restore an unfinished draft so a refresh doesn't wipe the wizard.
  useEffect(() => {
    if (initialTopic) return;
    // Last-used settings first; an unfinished draft below overrides them.
    try {
      const raw = localStorage.getItem(DEFAULTS_KEY);
      if (raw) {
        const defaults = JSON.parse(raw) as IntakeDraft;
        if (
          defaults.questionCount &&
          (SESSION_SIZE_PRESETS as readonly number[]).includes(
            defaults.questionCount,
          )
        ) {
          setQuestionCount(defaults.questionCount);
        }
        if (
          defaults.difficulty &&
          DIFFICULTY_OPTIONS.some((o) => o.value === defaults.difficulty)
        ) {
          setDifficulty(defaults.difficulty);
        }
      }
    } catch {
      // Ignore malformed defaults.
    }
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as IntakeDraft;
      if (draft.description && !form.getValues("description")) {
        form.setValue("description", draft.description, {
          shouldValidate: true,
        });
      }
      if (draft.presetCode) setSelectedPresetCode(draft.presetCode);
      if (draft.questionCount) setQuestionCount(draft.questionCount);
      if (draft.difficulty) setDifficulty(draft.difficulty);
    } catch {
      // Ignore malformed drafts.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (initialTopic) return;
    try {
      const draft: IntakeDraft = {
        description,
        presetCode: selectedPresetCode,
        questionCount,
        difficulty,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Storage unavailable (private mode) — draft persistence is best-effort.
    }
  }, [
    description,
    selectedPresetCode,
    questionCount,
    difficulty,
    initialTopic,
  ]);

  // A preset stays selected only while the description still refers to it —
  // rewriting the text to another exam drops the stale exam code.
  useEffect(() => {
    if (!selectedPresetCode) return;
    if (!description.toLowerCase().includes(selectedPresetCode.toLowerCase())) {
      setSelectedPresetCode(null);
      setAdaptiveEnabled(false);
    }
  }, [description, selectedPresetCode]);

  // Abort a streaming clarify request if the form unmounts mid-analysis.
  useEffect(() => () => clarifyAbortRef.current?.abort(), []);

  function applyPreset(examCode: string, examName: string) {
    if (selectedPresetCode === examCode) {
      setSelectedPresetCode(null);
      setAdaptiveEnabled(false);
      return;
    }
    const presetDescription = `I'm preparing for the ${examName} (${examCode}) certification exam. Generate practice questions across the main exam domains.`;
    setSelectedPresetCode(examCode);
    form.setValue("description", presetDescription, { shouldValidate: true });
    // A known exam blueprint needs no clarification — skip the analyze
    // round-trip and jump straight to session setup. The Edit button still
    // takes the user back to tweak the description (which re-analyzes).
    setClarifying([]);
    setClarificationAnswers({});
    setAnalyzedDescription(presetDescription);
    setPhase("customize");
  }

  function handleClarificationChange(id: string, value: string | undefined) {
    setClarificationAnswers((prev) => {
      const next = { ...prev };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
  }

  async function onSubmitDescription(values: IntakeValues) {
    if (USE_MOCKS) {
      setClarifying(mockClarifyingQuestions);
      setAnalyzedDescription(values.description);
      setPhase("customize");
      return;
    }

    // Re-analyzing an unchanged description would return the same questions —
    // skip the API round-trip and keep any answers already given.
    if (analyzedDescription === values.description) {
      setPhase("customize");
      return;
    }

    setPhase("analyzing");
    setClarifying([]);
    setClarificationAnswers({});
    setAnalyzeStatus("Analyzing your exam goals…");
    setIsClarifyStreaming(true);
    const controller = new AbortController();
    clarifyAbortRef.current = controller;
    try {
      const result = await api.clarify(values.description, {
        signal: controller.signal,
        onStatus: setAnalyzeStatus,
        onQuestion: (index, question) => {
          setClarifying((prev) => {
            const next = [...prev];
            next[index] = question;
            return next;
          });
        },
      });
      setClarifying(result.needsClarification ? result.questions : []);
      setAnalyzedDescription(values.description);
      setPhase("customize");
    } catch (err) {
      setPhase("describe");
      if (!(err instanceof Error && err.name === "AbortError")) {
        toast.error(
          err instanceof Error ? err.message : "Could not analyze description",
        );
      }
    } finally {
      setIsClarifyStreaming(false);
      clarifyAbortRef.current = null;
    }
  }

  function cancelAnalyze() {
    clarifyAbortRef.current?.abort();
    setIsClarifyStreaming(false);
    setPhase("describe");
  }

  function cancelGenerate() {
    useGenerationStore.getState().clear();
    setPhase("customize");
  }

  async function handleGenerate() {
    if (questionCount > remaining) {
      toast.error(`Only ${remaining} questions remaining on your plan`);
      return;
    }
    setPhase("generating");
    setGenerateStatus("Generating exam-style questions…");
    setGenerateMeta({});
    setQuestionPreviews([]);
    setCompletedQuestions(0);
    try {
      localStorage.setItem(
        DEFAULTS_KEY,
        JSON.stringify({ questionCount, difficulty } satisfies IntakeDraft),
      );
    } catch {
      // Storage unavailable — defaults are best-effort.
    }

    if (USE_MOCKS) {
      const text = form.getValues("description").toLowerCase();
      const examCode = text.includes("az-900")
        ? "AZ-900"
        : text.includes("google") || text.includes("gcp")
          ? "GCP-ACE"
          : "SAA-C03";
      const exam = text.includes("az-900")
        ? "Microsoft Azure Fundamentals"
        : examCode === "GCP-ACE"
          ? "Google Cloud Associate Engineer"
          : "AWS Certified Solutions Architect – Associate";
      const focus: string[] = [];
      if (text.includes("network")) focus.push("Networking");
      if (text.includes("security") || text.includes("iam"))
        focus.push("Security & Identity");
      if (text.includes("storage")) focus.push("Storage");
      if (focus.length === 0) focus.push("Mixed topics");

      const id = await useSessionStore
        .getState()
        .startSession(exam, examCode, focus);
      toast.success("Your practice session is ready");
      router.push(`/quiz/${id}`);
      return;
    }

    // Key clarification answers by the question text so the generation prompt
    // reads "- How soon is your exam?: Within 2 weeks" instead of "- c1: …".
    const clarifications: Record<string, string> = {};
    for (const q of clarifying) {
      const answer = clarificationAnswers[q.id];
      if (answer) clarifications[q.question] = answer;
    }

    try {
      useGenerationStore.getState().startPracticeGeneration(
        {
          description: form.getValues("description"),
          clarifications,
          fileId,
          count: questionCount,
          focusTopics: initialTopic ? [initialTopic] : undefined,
          exam: selectedPreset ? selectedPreset.exam : undefined,
          examCode: selectedPreset?.examCode,
          adaptive: adaptiveEnabled,
          focusDomainIds: adaptiveFocusDomainIds,
          durationSec: timedPractice ? practiceMinutes * 60 : undefined,
          difficulty:
            difficulty === "mixed"
              ? undefined
              : (difficulty as "easier" | "harder"),
        },
        {
          onStatus: setGenerateStatus,
          onMetadata: setGenerateMeta,
          onQuestionPreview: (index, preview) => {
            if (preview.topic) {
              setQuestionPreviews((prev) => {
                const next = [...prev];
                next[index] = preview.topic!;
                return next;
              });
            }
          },
          onQuestion: (index) => {
            setCompletedQuestions(index + 1);
          },
          onReady: (session) => {
            try {
              sessionStorage.removeItem(DRAFT_KEY);
            } catch {
              // ignore
            }
            toast.success("Session started — first question is ready");
            router.push(`/quiz/${session.id}`);
          },
          onDone: async () => {
            await hydrate();
          },
          onError: (err) => {
            setPhase("customize");
            if (
              err instanceof ApiClientError &&
              err.code === "FREEMIUM_LIMIT"
            ) {
              toast.error(
                "Question limit reached. Upgrade your plan for more practice.",
              );
            } else {
              toast.error(err.message);
            }
          },
        },
      );
    } catch (err) {
      setPhase("customize");
      toast.error(err instanceof Error ? err.message : "Generation failed");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("PDF must be 5 MB or smaller");
      e.target.value = "";
      return;
    }

    setFileName(file.name);

    if (USE_MOCKS) {
      toast.success(`Attached ${file.name}`);
      return;
    }

    setUploading(true);
    try {
      const { fileId: id } = await api.uploadPdf(file);
      setFileId(id);
      toast.success(`Attached ${file.name}`);
    } catch (err) {
      setFileName(null);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const stepIndex: 0 | 1 | 2 =
    phase === "describe" || phase === "analyzing"
      ? 0
      : phase === "customize"
        ? 1
        : 2;

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator current={stepIndex} />

      {(phase === "describe" || phase === "analyzing") && (
        <>
          {!initialTopic && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Quick start from a preset
                </CardTitle>
                <CardDescription>
                  Tap an exam to skip straight to session setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {presetGroups.map((group) => (
                  <div key={group.provider} className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {group.provider}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.presets.map((preset) => {
                        const active = selectedPresetCode === preset.examCode;
                        return (
                          <button
                            key={preset.examCode}
                            type="button"
                            aria-pressed={active}
                            disabled={phase === "analyzing"}
                            onClick={() =>
                              applyPreset(preset.examCode, preset.exam)
                            }
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                              active
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50",
                              phase === "analyzing" &&
                                "pointer-events-none opacity-60",
                            )}
                          >
                            {active && (
                              <Check className="size-3.5 shrink-0 text-primary" />
                            )}
                            <span className="flex flex-col">
                              <span
                                className={cn(
                                  "text-sm font-medium leading-tight",
                                  active ? "text-primary" : "text-foreground",
                                )}
                              >
                                {preset.exam}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {preset.examCode}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Wand2 className="size-4 text-primary" />
                Describe your exam
                {initialTopic && (
                  <Badge variant="secondary" className="font-normal">
                    Focus: {initialTopic}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmitDescription)}>
                <FieldGroup>
                  <Field data-invalid={!!form.formState.errors.description}>
                    <FieldLabel htmlFor="description">
                      What are you preparing for?
                    </FieldLabel>
                    <Textarea
                      id="description"
                      rows={4}
                      placeholder="e.g. I'm taking the AWS SAA exam in 3 weeks and I'm weak in networking and security…"
                      aria-invalid={!!form.formState.errors.description}
                      disabled={phase === "analyzing"}
                      {...form.register("description")}
                    />
                    <FieldDescription>
                      {form.formState.errors.description?.message ??
                        "Mention the exam name and any topics you find difficult."}
                    </FieldDescription>
                  </Field>

                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={phase === "analyzing"}
                        onClick={() =>
                          form.setValue("description", p, {
                            shouldValidate: true,
                          })
                        }
                        className="rounded-md border border-border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <Field>
                    <FieldLabel htmlFor="syllabus">
                      Syllabus PDF (optional)
                    </FieldLabel>
                    {fileName ? (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          {uploading ? (
                            <Spinner className="size-4 shrink-0" />
                          ) : (
                            <FileText className="size-4 shrink-0 text-primary" />
                          )}
                          <span className="truncate">
                            {uploading ? "Uploading…" : fileName}
                          </span>
                        </span>
                        <button
                          type="button"
                          aria-label="Remove file"
                          disabled={uploading}
                          onClick={() => {
                            setFileName(null);
                            setFileId(undefined);
                          }}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="syllabus"
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50",
                          (uploading || phase === "analyzing") &&
                            "pointer-events-none opacity-60",
                        )}
                      >
                        {uploading ? (
                          <>
                            <Spinner className="size-5" />
                            <span>Uploading PDF…</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="size-5" />
                            <span>Tap to attach a syllabus PDF (max 5 MB)</span>
                          </>
                        )}
                        <input
                          id="syllabus"
                          type="file"
                          accept="application/pdf"
                          className="sr-only"
                          disabled={uploading || phase === "analyzing"}
                          onChange={handleFile}
                        />
                      </label>
                    )}
                  </Field>

                  {phase === "describe" && (
                    <Button
                      type="submit"
                      size="lg"
                      disabled={description.trim().length < 15 || uploading}
                    >
                      <Sparkles data-icon="inline-start" />
                      Continue
                    </Button>
                  )}

                  {phase === "analyzing" && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="lg"
                        className="flex-1"
                        disabled
                      >
                        <Spinner data-icon="inline-start" />
                        Analyzing your exam goals…
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={cancelAnalyze}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <AnimatePresence mode="wait">
        {phase === "analyzing" && clarifying.length === 0 && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <AnalyzeProgress
              status={analyzeStatus}
              questionCount={clarifying.length}
            />
          </motion.div>
        )}

        {phase === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            <GenerateProgress
              status={generateStatus}
              exam={generateMeta.exam ?? selectedPreset?.exam}
              examCode={generateMeta.examCode ?? selectedPreset?.examCode}
              focusTopics={generateMeta.focusTopics}
              previews={questionPreviews}
              completedCount={completedQuestions}
              total={questionCount}
            />
            <Button variant="outline" size="lg" onClick={cancelGenerate}>
              Cancel generation
            </Button>
          </motion.div>
        )}

        {(phase === "customize" ||
          (phase === "analyzing" && clarifying.length > 0)) && (
          <motion.div
            key="customize"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            {phase === "customize" && (
              <Card>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    {selectedPreset && (
                      <Badge variant="secondary" className="w-fit">
                        {selectedPreset.exam} · {selectedPreset.examCode}
                      </Badge>
                    )}
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPhase("describe")}
                  >
                    <Pencil data-icon="inline-start" />
                    Edit
                  </Button>
                </CardContent>
              </Card>
            )}

            {clarifying.length > 0 && (
              <ClarifyingQuestions
                questions={clarifying}
                answers={clarificationAnswers}
                onAnswerChange={handleClarificationChange}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "customize" && (
        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Session size</p>
                <div className="flex flex-wrap gap-2">
                  {SESSION_SIZE_PRESETS.map((n) => (
                    <OptionChip
                      key={n}
                      active={questionCount === n}
                      disabled={n > maxQuestions}
                      onClick={() => setQuestionCount(n)}
                    >
                      {n} questions
                    </OptionChip>
                  ))}
                </div>
                {maxQuestions < 20 && (
                  <p className="text-xs text-muted-foreground">
                    Limited to {maxQuestions} based on your remaining plan
                    quota.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      active={difficulty === opt.value}
                      onClick={() => setDifficulty(opt.value)}
                    >
                      {opt.label}
                    </OptionChip>
                  ))}
                </div>
              </div>

              {selectedPreset && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="adaptive" className="text-sm font-medium">
                      Smart session
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {topicMastery.length
                        ? "Weight questions toward your weakest domains"
                        : "Practice a few sessions first so we can find your weak areas"}
                    </p>
                  </div>
                  <Switch
                    id="adaptive"
                    checked={adaptiveEnabled}
                    onCheckedChange={setAdaptiveEnabled}
                    disabled={!topicMastery.length}
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="timed" className="text-sm font-medium">
                    Timed practice
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Optional session time limit
                  </p>
                </div>
                <Switch
                  id="timed"
                  checked={timedPractice}
                  onCheckedChange={setTimedPractice}
                />
              </div>
              {timedPractice && (
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 30].map((m) => (
                    <OptionChip
                      key={m}
                      active={practiceMinutes === m}
                      onClick={() => setPracticeMinutes(m)}
                    >
                      {m} min
                    </OptionChip>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setPhase("describe")}
            >
              <ArrowLeft data-icon="inline-start" />
              Back
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleGenerate}
              disabled={isClarifyStreaming || questionCount > maxQuestions}
            >
              {isClarifyStreaming ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {isClarifyStreaming
                ? "Loading questions…"
                : "Generate & start session"}
            </Button>
          </div>
          {clarifying.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Your description looks clear — ready to generate questions.
            </p>
          )}
        </div>
      )}

      {(phase === "customize" || phase === "generating") && (
        <p className="text-center text-xs text-muted-foreground">
          {remaining === Infinity
            ? "Unlimited questions on your plan"
            : `${remaining} questions remaining on your plan`}
        </p>
      )}
    </div>
  );
}
