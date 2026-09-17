/**
 * Optional later hook: point VITE_FLY_LLM_URL at a chat-completions-compatible
 * endpoint to replace Chinese narration. The default agent NEVER depends on this
 * and will clear the shipped level fully offline.
 */
export async function optionalNarrate(prompt: string): Promise<string | null> {
  const url = import.meta.env.VITE_FLY_LLM_URL as string | undefined;
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: import.meta.env.VITE_FLY_LLM_MODEL ?? "local",
        messages: [
          {
            role: "system",
            content: "你是一只果蝇，用不超过12个汉字旁白平台跳跃决策。",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
