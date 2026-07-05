import { z } from "zod";
import { runGenerateSessionStream } from "@/lib/ai/generate-session-stream";
import { createEventStream } from "@/lib/ai/sse";
import { requireUser } from "@/lib/api/auth";
import { apiError, getTimezone, handleRouteError } from "@/lib/api/route-utils";
import { checkRateLimit } from "@/lib/db/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceFreemium } from "@/lib/db/usage";
import { getExamBlueprint } from "@/lib/exams";
import { difficultyPreferenceGuidance } from "@/lib/ai/difficulty";
import { loadAdaptiveDifficulty } from "@/lib/progress/adaptive";

export const runtime = "nodejs";

const bodySchema = z.object({
  description: z.string().min(15),
  clarifications: z.record(z.string(), z.string()).optional(),
  fileId: z.string().uuid().optional(),
  count: z.number().int().min(1).max(20).optional(),
  focusTopics: z.array(z.string()).optional(),
  exam: z.string().optional(),
  examCode: z.string().optional(),
  focusDomainIds: z.array(z.string()).optional(),
  adaptive: z.boolean().optional(),
  durationSec: z.number().int().min(0).optional(),
  difficulty: z.enum(["easier", "balanced", "harder"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!(await checkRateLimit(`generate:${user.id}`, 10))) {
      return apiError("Rate limit exceeded", 429);
    }

    const body = bodySchema.parse(await request.json());
    const count = body.count ?? 5;
    const admin = createAdminClient();

    const check = await enforceFreemium(admin, user.id, count);

    let groundingText: string | undefined;
    if (body.fileId) {
      const { data: upload } = await admin
        .from("uploads")
        .select("extracted_text")
        .eq("id", body.fileId)
        .eq("user_id", user.id)
        .single();
      groundingText = upload?.extracted_text;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single();

    // Any recognized exam code gets blueprint-driven, domain-weighted
    // generation; focusDomainIds (Smart session) narrows it to weak domains.
    const blueprint = body.examCode ? getExamBlueprint(body.examCode) : null;

    const adaptiveDifficulty = await loadAdaptiveDifficulty(
      admin,
      user.id,
      body.examCode ?? blueprint?.examCode,
    );

    const timezone = profile?.timezone ?? getTimezone(request);
    const remainingFreeQuestions =
      check.remaining === Infinity
        ? Infinity
        : Math.max(0, check.remaining - count);

    return createEventStream(async (send) => {
      await runGenerateSessionStream(
        admin,
        user.id,
        {
          description: body.description,
          clarifications: body.clarifications,
          count,
          groundingText,
          mode: "practice",
          focusTopics: body.focusTopics,
          exam: body.exam ?? blueprint?.exam,
          examCode: body.examCode ?? blueprint?.examCode,
          durationSec: body.durationSec,
          blueprint: blueprint ?? undefined,
          focusDomainIds: body.focusDomainIds,
          adaptiveDifficulty: adaptiveDifficulty ?? undefined,
          difficultyHint: body.difficulty
            ? difficultyPreferenceGuidance(body.difficulty)
            : undefined,
        },
        send,
        { timezone, remainingFreeQuestions },
      );
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
