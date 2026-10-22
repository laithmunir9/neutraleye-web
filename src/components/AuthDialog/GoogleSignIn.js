"use client";

import { useEffect, useRef } from "react";
import { createGoogleNonce } from "@/lib/googleNonce";
import styles from "./AuthDialog.module.css";

// hl=en: without it the placeholder Google draws before its button loads
// follows the visitor's location, not the page's language.
const SCRIPT_SRC = "https://accounts.google.com/gsi/client?hl=en";
let scriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Google sign-in could not load."));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/*
 * Google's own "Continue with Google" button (Google Identity Services).
 * Google's window is opened by this site, so it names tryneutraleye.com, not
 * the Supabase project. Google hands back an ID token, which the caller trades
 * for a Supabase session with signInWithIdToken.
 *
 * Google renders the button itself, so its look is Google's (the outlined
 * light theme), not ours. The script loads on first use, never on page load.
 * Google keeps one handler per page, so mount this only while its dialog is
 * open.
 */
export default function GoogleSignIn({ clientId, onCredential, onError }) {
  const slot = useRef(null);
  const handlers = useRef({ onCredential, onError });

  useEffect(() => {
    handlers.current = { onCredential, onError };
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadGoogleScript(), createGoogleNonce()])
      .then(([, nonce]) => {
        if (cancelled || !slot.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          callback: (response) => handlers.current.onCredential(response.credential, nonce.raw),
        });
        // Google's widths run from 200 to 400 pixels; fill the form's width within that.
        const width = Math.min(400, Math.max(200, Math.round(slot.current.clientWidth)));
        window.google.accounts.id.renderButton(slot.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          // Google otherwise picks the language from the visitor's browser or
          // location; the site is in English, so the button is too.
          locale: "en",
          width,
        });
      })
      .catch((error) => {
        if (!cancelled) handlers.current.onError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return <div ref={slot} className={styles.googleSlot} />;
}
