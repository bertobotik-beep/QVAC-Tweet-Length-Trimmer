// QVAC Tweet Length Trimmer — core logic.
// completion() trims text to fit a character limit while keeping meaning.
// The limit is a hard requirement, so it is enforced deterministically in
// code afterward rather than trusted to the prompt alone.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i am not able"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function stripPreamble(text) {
  return text
    .trim()
    .replace(/^(here'?s|here is)[^:\n]*:\s*/i, "")
    .replace(/^trimmed( version)?:\s*/i, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

// Hard truncation on a word boundary, always guaranteed to fit the limit.
function hardTruncate(text, limit) {
  if (text.length <= limit) return text;
  const ellipsis = "...";
  const budget = Math.max(0, limit - ellipsis.length);
  let cut = text.slice(0, budget);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > budget * 0.6) cut = cut.slice(0, lastSpace);
  return (cut.trim() + ellipsis).slice(0, limit);
}

export async function trimToLength(modelId, text, limit) {
  // Already fits — nothing to do.
  if (text.length <= limit) {
    return { trimmed: text, length: text.length, limit, modelUsed: false };
  }

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          `Rewrite the given text so it fits within ${limit} characters total, while keeping ` +
          "the core meaning and the most important point. Cut examples, filler, and less " +
          "important clauses first. Reply with ONLY the trimmed text, no preamble, no quotes, " +
          "no character count.",
      },
      { role: "user", content: text },
    ],
    stream: true,
    completionOpts: { temperature: 0.4, maxTokens: 220 },
  });

  let raw = "";
  for await (const token of run.tokenStream) raw += token;
  let trimmed = stripPreamble(raw);

  if (looksUnusable(trimmed)) trimmed = text;

  // Deterministic enforcement: the model is not reliable at counting
  // characters, so hard-truncate if it still overshoots the limit.
  const modelUsed = true;
  if (trimmed.length > limit) trimmed = hardTruncate(trimmed, limit);

  return { trimmed, length: trimmed.length, limit, modelUsed };
}
