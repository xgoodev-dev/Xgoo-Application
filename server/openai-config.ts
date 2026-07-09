/** Resolve OpenAI API key from supported environment variable names. */
export function resolveOpenAiApiKey(): string {
  return (
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    ""
  );
}

export function isOpenAiConfigured(): boolean {
  return resolveOpenAiApiKey().length > 0;
}
