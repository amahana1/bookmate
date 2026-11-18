/** Login page URL that brings the member back to `returnTo` afterwards. */
export function buildLoginUrl(returnTo: string): string {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
  return next;
}
