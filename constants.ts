// Research constants
export const MAX_ITERATIONS = 3; // Maximum number of iterations
export const MAX_SEARCH_RESULTS = 5; // Maximum number of search results
export const MAX_CONTENT_CHARS = 20000; // Maximum number of characters in the content
export const MAX_RETRY_ATTEMPTS = 3; // Number of times the model will retry
export const RETRY_DELAY_MS = 1000; // Delay between retries in ms

// Free model and fallback
const FREE_MODEL: string = "mistralai/mistral-7b-instruct";
const FALLBACK_MODEL: string = "openai/gpt-3.5-turbo";

// Function to get model dynamically with fallback
export async function getModelWithFallback(
  taskName: keyof typeof MODELS,
  callModelFn: (model: string) => Promise<any>
): Promise<any> {
  const models: Record<keyof typeof MODELS, string[]> = {
    PLANNING: [FREE_MODEL, FALLBACK_MODEL],
    EXTRACTION: [FREE_MODEL, FALLBACK_MODEL],
    ANALYSIS: [FREE_MODEL, FALLBACK_MODEL],
    REPORT: [FREE_MODEL, FALLBACK_MODEL],
  };

  const candidates = models[taskName] || [FREE_MODEL];

  for (const model of candidates) {
    try {
      return await callModelFn(model);
    } catch (err) {
      console.warn(`Model call failed for ${model}, trying fallback...`, err);
    }
  }
  throw new Error(`All model calls failed for task: ${taskName}`);
}

// Default export in case needed
export const MODELS = {
  PLANNING: FREE_MODEL,
  EXTRACTION: FREE_MODEL,
  ANALYSIS: FREE_MODEL,
  REPORT: FREE_MODEL,
};
