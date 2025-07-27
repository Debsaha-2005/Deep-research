import { Activity, ActivityTracker, ResearchFindings } from "./types";

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const combineFindings = (findings: ResearchFindings[]): string => {
  return findings
    .map(finding => `${finding.summary}\n\n Source: ${finding.source}`)
    .join('\n\n---\n\n');
};

/**
 * Handles errors by logging to activityTracker if available,
 * and returns a fallback value or undefined.
 * 
 * @param error The error object caught.
 * @param context Context description of where error happened.
 * @param activityTracker Optional ActivityTracker to log error.
 * @param activityType Optional Activity type to categorize the log.
 * @param fallbackReturn Optional fallback value to return.
 * @returns fallbackReturn or undefined.
 */
export const handleError = <T>(
  error: unknown,
  context: string,
  activityTracker?: ActivityTracker,
  activityType?: Activity["type"],
  fallbackReturn?: T
): T | undefined => {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  if (activityTracker && activityType) {
    // Use only allowed status strings: "pending", "complete", "warning", "error"
    activityTracker.add(activityType, "error", `${context} failed: ${errorMessage}`);
  }
  return fallbackReturn;
};

// Example usage fix: 
// Instead of "warn", use "warning"
export const logAttemptFailure = (
  activityTracker: ActivityTracker,
  activityType: Activity["type"],
  attempt: number,
  errorMsg: string
) => {
  activityTracker.add(activityType, "warning", `Attempt ${attempt + 1} failed: ${errorMsg}`);
};

// Instead of "info", use "pending" or "complete" or "warning"
export const logPromptReduction = (
  activityTracker: ActivityTracker,
  activityType: Activity["type"],
  currentPrompt: string
) => {
  activityTracker.add(activityType, "pending", `Reducing prompt size to ${currentPrompt.length} and retrying.`);
};
