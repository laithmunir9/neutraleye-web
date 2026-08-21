import * as Sentry from "@sentry/nextjs";
import {
  AUTH_UNAVAILABLE_MESSAGE,
  SIGNUP_OUTCOME,
  SIGNUP_RESEND_WAIT_MESSAGE,
  classifySignUpResult,
  isAuthTransportError,
  reportAuthError,
  safeAuthCall,
} from "../authErrors";

jest.mock("@sentry/nextjs", () => ({ captureException: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

// Shapes supabase-js actually produces when the auth host is unreachable.
function retryableFetchError(message = "Failed to fetch") {
  const err = new Error(message);
  err.name = "AuthRetryableFetchError";
  err.status = 0;
  return err;
}

function apiError(message, status = 400) {
  const err = new Error(message);
  err.name = "AuthApiError";
  err.status = status;
  return err;
}

describe("isAuthTransportError", () => {
  it("flags AuthRetryableFetchError", () => {
    expect(isAuthTransportError(retryableFetchError())).toBe(true);
  });

  it("flags a bare fetch TypeError from the browser", () => {
    expect(isAuthTransportError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("flags Safari's wording for the same failure", () => {
    expect(isAuthTransportError(new TypeError("Load failed"))).toBe(true);
  });

  it("flags undici's server-side wording", () => {
    expect(isAuthTransportError(new TypeError("fetch failed"))).toBe(true);
  });

  it("flags DNS failure against a paused project", () => {
    expect(isAuthTransportError(new Error("getaddrinfo ENOTFOUND foo.supabase.co"))).toBe(true);
  });

  it("flags a 5xx from the auth service", () => {
    expect(isAuthTransportError(apiError("Internal Server Error", 503))).toBe(true);
  });

  it("does NOT flag wrong credentials", () => {
    expect(isAuthTransportError(apiError("Invalid login credentials", 400))).toBe(false);
  });

  it("does NOT flag a weak password", () => {
    expect(isAuthTransportError(apiError("Password should be at least 6 characters", 422))).toBe(false);
  });

  it("does NOT flag Supabase's own email rate limit", () => {
    expect(isAuthTransportError(apiError("email rate limit exceeded", 429))).toBe(false);
  });

  it("is safe on null", () => {
    expect(isAuthTransportError(null)).toBe(false);
  });
});

describe("reportAuthError", () => {
  it("sends transport failures to Sentry and returns a human message", () => {
    const message = reportAuthError(retryableFetchError(), "signup");
    expect(message).toBe(AUTH_UNAVAILABLE_MESSAGE);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [captured, context] = Sentry.captureException.mock.calls[0];
    expect(captured.name).toBe("AuthRetryableFetchError");
    expect(context.tags).toMatchObject({ area: "auth", auth_action: "signup" });
  });

  it("never leaks the raw host string to the user", () => {
    const message = reportAuthError(
      retryableFetchError("Failed to fetch (hkxtymihsyegrmqnvdvn.supabase.co)"),
      "signup"
    );
    expect(message).toBe(AUTH_UNAVAILABLE_MESSAGE);
    expect(message).not.toMatch(/supabase\.co/);
    expect(message).not.toMatch(/failed to fetch/i);
  });

  it("passes expected user errors through untouched and does NOT alert", () => {
    const message = reportAuthError(apiError("Invalid login credentials"), "signin");
    expect(message).toBe("Invalid login credentials");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("returns empty string and stays quiet when there is no error", () => {
    expect(reportAuthError(null, "signin")).toBe("");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports each auth action under its own tag", () => {
    reportAuthError(retryableFetchError(), "token_refresh");
    expect(Sentry.captureException.mock.calls[0][1].tags.auth_action).toBe("token_refresh");
  });
});

describe("safeAuthCall", () => {
  it("passes a normal resolved result straight through", async () => {
    const { data, error } = await safeAuthCall("signin", async () => ({
      data: { session: { id: 1 } },
      error: null,
    }));
    expect(data.session.id).toBe(1);
    expect(error).toBeNull();
  });

  it("converts a REJECTED promise into an error value instead of blowing up", async () => {
    const { data, error } = await safeAuthCall("get_session", async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(TypeError);
  });

  it("still surfaces an error returned as a value", async () => {
    const { error } = await safeAuthCall("signin", async () => ({
      data: null,
      error: apiError("Invalid login credentials"),
    }));
    expect(error.message).toBe("Invalid login credentials");
  });
});

// Each fixture below is copied from a real response captured against the live
// Supabase project on 2026-08-14. See classifySignUpResult for the full matrix.
describe("classifySignUpResult", () => {
  // Attempt #1: brand new address -> real user, one identity.
  const freshSignUp = {
    data: {
      user: {
        id: "389d924d-20e1-42be-ba65-705f36c3b65d",
        email: "new@example.com",
        confirmed_at: null,
        identities: [{ identity_id: "c0476e11", provider: "email" }],
      },
    },
    error: null,
  };

  // Attempt #4: address belongs to a CONFIRMED account -> obfuscated decoy user,
  // different id, identities deliberately empty, and no email is ever sent.
  const alreadyRegistered = {
    data: {
      user: {
        id: "408a6dde-a79c-41cd-bd62-de49c442fbd4",
        email: "taken@example.com",
        confirmed_at: null,
        identities: [],
      },
    },
    error: null,
  };

  // Attempt #2: retry inside Supabase's email-send window.
  function rateLimitError() {
    const err = new Error("For security purposes, you can only request this after 56 seconds.");
    err.name = "AuthApiError";
    err.status = 429;
    err.code = "over_email_send_rate_limit";
    return err;
  }

  it("treats a brand new address as created", () => {
    expect(classifySignUpResult(freshSignUp).outcome).toBe(SIGNUP_OUTCOME.CREATED);
  });

  it("treats an existing UNCONFIRMED address as created, since Supabase does resend", () => {
    // Attempt #3: verified live. Same real user id, identity still present.
    const existingUnconfirmed = {
      data: { user: { ...freshSignUp.data.user, identities: [{ identity_id: "c0476e11" }] } },
      error: null,
    };
    expect(classifySignUpResult(existingUnconfirmed).outcome).toBe(SIGNUP_OUTCOME.CREATED);
  });

  it("detects an existing CONFIRMED address by its empty identities array", () => {
    expect(classifySignUpResult(alreadyRegistered).outcome).toBe(SIGNUP_OUTCOME.ALREADY_REGISTERED);
  });

  it("routes already-registered to the SAME screen so the response does not leak who has an account", () => {
    const a = classifySignUpResult(freshSignUp);
    const b = classifySignUpResult(alreadyRegistered);
    expect(a.showConfirmationScreen).toBe(true);
    expect(b.showConfirmationScreen).toBe(true);
    expect(a.message).toBe(b.message);
  });

  it("detects the email resend rate limit by code", () => {
    const result = classifySignUpResult({ data: null, error: rateLimitError() });
    expect(result.outcome).toBe(SIGNUP_OUTCOME.RESEND_RATE_LIMITED);
    expect(result.showConfirmationScreen).toBe(false);
    expect(result.message).toBe(SIGNUP_RESEND_WAIT_MESSAGE);
  });

  it("does not show the user Supabase's raw countdown wording", () => {
    const result = classifySignUpResult({ data: null, error: rateLimitError() });
    expect(result.message).not.toMatch(/for security purposes/i);
    expect(result.message).not.toMatch(/56 seconds/);
  });

  it("does not alert Sentry for a rate limit, which is expected behaviour", () => {
    classifySignUpResult({ data: null, error: rateLimitError() });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("treats a genuine transport failure as failed AND alerts", () => {
    const err = new Error("Failed to fetch");
    err.name = "AuthRetryableFetchError";
    const result = classifySignUpResult({ data: null, error: err });
    expect(result.outcome).toBe(SIGNUP_OUTCOME.FAILED);
    expect(result.showConfirmationScreen).toBe(false);
    expect(result.message).toBe(AUTH_UNAVAILABLE_MESSAGE);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("passes a weak-password rejection through without alerting", () => {
    const err = new Error("Password should be at least 6 characters");
    err.name = "AuthApiError";
    err.status = 422;
    const result = classifySignUpResult({ data: null, error: err });
    expect(result.outcome).toBe(SIGNUP_OUTCOME.FAILED);
    expect(result.message).toBe("Password should be at least 6 characters");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("is safe when the response has no user at all", () => {
    expect(classifySignUpResult({ data: null, error: null }).outcome).toBe(SIGNUP_OUTCOME.CREATED);
  });
});
