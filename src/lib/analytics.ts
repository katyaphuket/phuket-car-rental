export const YM_COUNTER_ID = 110235170;
export const GA_MEASUREMENT_ID = "G-SDQ1ZB3TFX";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackBookingSubmit() {
  if (typeof window === "undefined") return;
  window.ym?.(YM_COUNTER_ID, "reachGoal", "booking_submit");
  window.gtag?.("event", "booking_submit");
}
