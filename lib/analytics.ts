export type AnalyticsEventName =
  | "hero_cta_click"
  | "secondary_cta_click"
  | "sync_state_click"
  | "theme_like_click"
  | "waitlist_submit"
  | "feature_selected"
  | "paid_feature_selected"
  | "leave_app_demo"
  | "return_app_demo"
  | "speech_bubble_click"
  | "ambient_sound_toggle";

export function trackEvent(
  eventName: AnalyticsEventName,
  payload: Record<string, string | number | boolean | string[] | undefined> = {}
) {
  console.log("[EmberRoom event]", eventName, {
    ...payload,
    timestamp: new Date().toISOString()
  });
}
