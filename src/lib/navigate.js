/* A full page load rather than a client-side route change, so the server sees
   the session cookies a sign-in has just set. Its own module so tests can
   replace it: jsdom cannot follow a navigation. */
export function navigateTo(path) {
  window.location.assign(path);
}
