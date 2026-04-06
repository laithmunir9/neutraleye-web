/**
 * @typedef {Object} AnalysisExample
 * @property {string} quote
 * @property {string} label
 * @property {string} explanation
 * @property {string[]=} highlights
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string} id
 * @property {string} createdAt
 * @property {"text" | "url"} inputType
 * @property {string=} url
 * @property {string=} title
 * @property {string} direction
 * @property {string=} directionLabel
 * @property {number} confidence
 * @property {number} score
 * @property {string} summary
 * @property {string[]} drivers
 * @property {AnalysisExample[]} examples
 * @property {Array<string | {name: string, url: string}>} sources
 * @property {string[]} recommendations
 * @property {{requestId: string, requestStartedAt: string, requestCompletedAt: string, status: number, endpoint: string}=} requestMeta
 */

export const ANALYSIS_STORAGE_KEY = "neutraleye.analyses.v1";
