import ms, { type StringValue } from "ms";

export function getDurationMs(duration: StringValue): number {
  return ms(duration);
}

export function getExpiryTime(duration: StringValue): Date {
  return new Date(Date.now() + getDurationMs(duration));
}
