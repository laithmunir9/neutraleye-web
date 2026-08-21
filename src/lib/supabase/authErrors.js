import * as Sentry from "@sentry/nextjs";

// supabase-js returns auth failures as VALUES ({ data, error }) rather than throwing,
// so a fully unreachable auth service produces no unhandled exception and Sentry never
// sees it. That is how a paused Supabase project took signup down silently in Aug 2026.
// Everything here exists to make transport failures loud (Sentry) and honest (user copy).

export const AUTH_UNAVAILABLE_MESSAGE =
  "We can't reach the sign-in service right now. Please try again in a few minutes.";

// Wording varies by runtime for the same underlying "could not reach the host":
// Chrome "Failed to fetch", Safari "Load failed", undici/Node "fetch failed".
const TRANSPORT_MESSAGE_PATTERNS = [
  "failed to fetch",
  "load failed",
  "networkerror",
  "network request failed",
  "fetch failed",
  "err_name_not_resolved",
  "err_connection",
  "err_internet_disconnected",
  "enotfound",
  "econnrefused",
  "econnreset",
  "etimedout",
  "socket hang up",
];

// supabase-js wraps anything retryable (network drop, 5xx) in this class.
const TRANSPORT_ERROR_NAMES = new Set(["AuthRetryableFetchError", "AuthUnknownError"]);

export function isAuthTransportError(error) {
  if (!error) return false;
  if (TRANSPORT_ERROR_NAMES.has(error.name)) return true;
  // The auth service answered, but it is broken rather than rejecting the user.
  if (typeof error.status === "number" && error.status >= 500) return true;
  const message = String(error.message || "").toLowerCase();
  return TRANSPORT_MESSAGE_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Decide what the user sees and whether we alert.
 *
 * Transport failures are our outage and go to Sentry. Expected, user-driven
 * outcomes (wrong password, weak password, email rate limit) are not bugs and
 * stay out of Sentry, matching the SENTRY_CAPTURE_CODES policy in apiLog.js.
 *
 * @returns {string} message safe to render to the user ("" when there is no error)
 */
export function reportAuthError(error, action, extra = {}) {
  if (!error) return "";
  if (!isAuthTransportError(error)) {
    return error.message || "Something went wrong. Please try again.";
  }
  Sentry.captureException(error, {
    tags: { area: "auth", auth_action: action },
    extra,
  });
  return AUTH_UNAVAILABLE_MESSAGE;
}

export const SIGNUP_OUTCOME = {
  CREATED: "created",
  ALREADY_REGISTERED: "already_registered",
  RESEND_RATE_LIMITED: "resend_rate_limited",
  FAILED: "failed",
};

// "About a minute" tracks smtp_max_frequency, the 60s minimum between emails to the SAME
// address, which is the limit that actually produces this 429. It is NOT the project-wide
// ceiling of 30 emails/hour (dashboard: Auth -> Rate Limits). Those are separate limits, and
// neither one moves if the SMTP provider changes.
export const SIGNUP_RESEND_WAIT_MESSAGE =
  "A confirmation link was sent to this address moments ago. Please wait about a minute before requesting another one.";

/**
 * Work out what actually happened during signUp.
 *
 * Verified against the live project on 2026-08-14, because the behaviour is not
 * what the docs imply:
 *
 *   new address                  -> 200, real user, identities: [ ... ]
 *   existing, UNCONFIRMED        -> 200, real user, identities: [ ... ], email IS resent,
 *                                   and the stored password is NOT overwritten
 *   existing, UNCONFIRMED, fast  -> 429 over_email_send_rate_limit, nothing sent
 *   existing, CONFIRMED          -> 200, DECOY user with a different id and
 *                                   identities: [], and no email is ever sent
 *
 * The last row is the one that stranded users: the app said "check your inbox"
 * for a message Supabase had already decided not to send.
 *
 * ALREADY_REGISTERED still routes to the confirmation screen on purpose. Branching
 * the UI here would turn signup into an account-existence oracle, undoing the
 * decoy response Supabase went out of its way to produce. The screen's copy covers
 * both cases instead, so an existing user gets a way forward without us confirming
 * to a stranger that the address is taken.
 */
export function classifySignUpResult({ data, error } = {}) {
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return {
        outcome: SIGNUP_OUTCOME.RESEND_RATE_LIMITED,
        showConfirmationScreen: false,
        message: SIGNUP_RESEND_WAIT_MESSAGE,
      };
    }
    return {
      outcome: SIGNUP_OUTCOME.FAILED,
      showConfirmationScreen: false,
      message: reportAuthError(error, "signup"),
    };
  }

  const identities = data?.user?.identities;
  if (Array.isArray(identities) && identities.length === 0) {
    return {
      outcome: SIGNUP_OUTCOME.ALREADY_REGISTERED,
      showConfirmationScreen: true,
      message: "",
    };
  }

  return {
    outcome: SIGNUP_OUTCOME.CREATED,
    showConfirmationScreen: true,
    message: "",
  };
}

/**
 * Normalise an auth call to always resolve to { data, error }.
 *
 * Most supabase-js auth methods return errors as values, but some paths reject
 * outright. Callers should not have to care which, or the rejecting ones become
 * unhandled promise rejections that break the page instead of showing a message.
 */
export async function safeAuthCall(action, fn) {
  try {
    const result = await fn();
    if (result && typeof result === "object") return result;
    return { data: null, error: null };
  } catch (thrown) {
    return { data: null, error: thrown };
  }
}
