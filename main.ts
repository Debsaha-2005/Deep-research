/* eslint-disable @typescript-eslint/no-explicit-any */
import { createActivityTracker } from "./activity-tracker";
import { MAX_ITERATIONS } from "./constants";
import { analyzeFindings, generateReport, generateSearchQueries, processSearchResults, search } from "./research-functions";
import { ResearchState } from "./types";

export async function deepResearch(researchState: ResearchState, dataStream: any) {
  let iteration = 0;

  const activityTracker = createActivityTracker(dataStream, researchState);

  // Step 1: Generate initial search queries
  const initialQueries = await generateSearchQueries(researchState, activityTracker);

  if (!initialQueries || !("searchQueries" in initialQueries)) {
    throw new Error("Initial queries generation failed or returned invalid format");
  }

  // Stronger typing for currentQueries
  let currentQueries: string[] = (initialQueries as { searchQueries: string[] }).searchQueries;

  while (currentQueries.length > 0 && iteration < MAX_ITERATIONS) {
    iteration++;

    console.log("We are running on the iteration number: ", iteration);

    // Run all searches concurrently
    const searchResultsPromises = currentQueries.map((query: string) => search(query, researchState, activityTracker));
    const searchResultsResponses = await Promise.allSettled(searchResultsPromises);

    // Filter fulfilled results with non-empty results
    const allSearchResults = searchResultsResponses
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled" && Array.isArray(result.value) && result.value.length > 0)
      .map((result) => result.value)
      .flat();

    console.log(`We got ${allSearchResults.length} search results!`);

    // Process all the search results into new findings
    const newFindings = await processSearchResults(allSearchResults, researchState, activityTracker);

    console.log("Results are processed!");

    // Append new findings
    researchState.findings = [...(researchState.findings || []), ...newFindings];

    // Debug: print number of findings
    console.log(`Total findings collected so far: ${researchState.findings.length}`);

    // Analyze findings to check sufficiency and get new queries
    const analysis = await analyzeFindings(researchState, currentQueries, iteration, activityTracker);

    console.log("Analysis: ", analysis);

    if (analysis && typeof analysis === "object" && "sufficient" in analysis && analysis.sufficient) {
      console.log("Sufficient information gathered, breaking loop.");
      break;
    }

    // Prepare next set of queries - filter out ones already searched
    const nextQueries = analysis && typeof analysis === "object" && Array.isArray(analysis.queries) ? analysis.queries : [];

    currentQueries = nextQueries.filter((query: string) => !currentQueries.includes(query));

    if (currentQueries.length === 0) {
      console.log("No new queries generated, ending research.");
      break;
    }
  }

  console.log("We are outside of the loop with total iterations: ", iteration);

  // Generate final report
  const report = await generateReport(researchState, activityTracker);

  // Push report to dataStream
  dataStream.writeData({
    type: "report",
    content: report,
  });

  return initialQueries;
}
