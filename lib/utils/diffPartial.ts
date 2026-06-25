function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

export function diffPartial<T extends Record<string, unknown>>(
  initial: T,
  current: T,
): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (stableStringify(initial[key]) !== stableStringify(current[key])) {
      patch[key] = current[key];
    }
  }
  return patch;
}

export function hasChanges<T extends Record<string, unknown>>(
  initial: T,
  current: T,
): boolean {
  return Object.keys(diffPartial(initial, current)).length > 0;
}
