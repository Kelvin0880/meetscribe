import type { MeetscribeApi } from "./index";

declare global {
  interface Window {
    meetscribe: MeetscribeApi;
  }
}
