export type ThemePreference = 'system' | 'light' | 'dark';

export interface ClientPreferences {
  theme: ThemePreference;
  currencyCode: string;
  activityNotificationsEnabled: boolean;
}
