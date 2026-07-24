/** One replaceable clock seam for all time-based decisions in the bot. */
let clock: () => Date = () => new Date();

export function now(): Date {
  return clock();
}

/** Test hook. Production code should only call now(). */
export function setClockForTest(value?: () => Date): void {
  clock = value ?? (() => new Date());
}
