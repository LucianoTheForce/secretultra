const BUILTIN_MASTER_EMAILS = ["luciano@theforce.cc"] as const;

function normalizeEmail(email: string | null | undefined): string | null {
  return email?.trim().toLowerCase() ?? null;
}

export function getConfiguredAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const envEmails = raw
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter((value): value is string => Boolean(value));

  const merged = new Set<string>(envEmails);
  for (const email of BUILTIN_MASTER_EMAILS) {
    merged.add(email);
  }

  return Array.from(merged.values());
}

export function isMasterAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return BUILTIN_MASTER_EMAILS.includes(normalized as typeof BUILTIN_MASTER_EMAILS[number]);
}

export function hasAdminAccess(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getConfiguredAdminEmails().includes(normalized);
}
