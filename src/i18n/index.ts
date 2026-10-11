import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import type english from './locales/en.json';

export type Locale = 'en' | 'zh-TW' | 'zh-CN' | 'ar';
export type TranslationKey = keyof typeof english;
type Dictionary = Record<string, string>;
export const languages: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'ar', label: 'العربية' }
];
const storageKey = 'operations-client-locale';
const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  en: () => import('./locales/en.json'),
  'zh-TW': () => import('./locales/zh-TW.json'),
  'zh-CN': () => import('./locales/zh-CN.json'),
  ar: () => import('./locales/ar.json')
};
export const i18n = createInstance();
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: false,
  resources: {},
  initAsync: false,
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false }
});
const pending = new Map<Locale, Promise<void>>();
let generation = 0;
let patterns: { key: string; regex: RegExp; names: string[] }[] = [];
export function savedLocale(): Locale {
  try {
    const value = localStorage.getItem(storageKey);
    return languages.find((item) => item.value === value)?.value ?? 'en';
  } catch {
    return 'en';
  }
}
export async function loadLocale(locale: Locale): Promise<void> {
  if (i18n.hasResourceBundle(locale, 'translation')) return;
  const current = pending.get(locale);
  if (current) return current;
  const request = loaders[locale]()
    .then(({ default: messages }) => {
      i18n.addResourceBundle(locale, 'translation', messages);
      // The keys are locale-independent; build matchers for legacy data content identifiers.
      patterns = Object.keys(messages)
        .filter((key) => key.includes('{{') && /[a-zA-Z]/.test(key.replace(/\{\{\w+\}\}/g, '')))
        .map((key) => {
          const names: string[] = [];
          const escaped = key
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\{\\\{(\w+)\\\}\\\}/g, (_, name: string) => {
              names.push(name);
              return '(.+?)';
            });
          return { key, names, regex: new RegExp(`^${escaped}$`) };
        });
    })
    .finally(() => pending.delete(locale));
  pending.set(locale, request);
  return request;
}
function updateDocument(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.title = translate('Operations Client / Portfolio demo');
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', translate('A clear view of Spot markets.'));
}
export async function changeLocale(locale: Locale, persist = true): Promise<boolean> {
  if (!languages.some((item) => item.value === locale)) throw new Error('Unsupported locale');
  const attempt = ++generation;
  await loadLocale(locale);
  if (attempt !== generation) return false;
  await i18n.changeLanguage(locale);
  if (attempt !== generation) return false;
  updateDocument(locale);
  if (persist) {
    try {
      localStorage.setItem(storageKey, locale);
    } catch {
      /* Browsing remains usable without storage. */
    }
  }
  return true;
}
export async function initializeLocale() {
  try {
    await changeLocale(savedLocale(), false);
  } catch {
    await changeLocale('en', false);
  }
}
export function useLocale(): Locale {
  const { i18n: instance } = useTranslation();
  return (instance.resolvedLanguage ?? instance.language ?? 'en') as Locale;
}
export function translate(key: TranslationKey, values?: Record<string, unknown>): string {
  return String(i18n.t(key, { ...values, defaultValue: key }));
}
export function localize<T>(value: T): T {
  if (typeof value !== 'string') return value;
  const key = value.replace(/\s+/g, ' ').trim();
  if (i18n.exists(key)) return String(i18n.t(key)) as T;
  for (const pattern of patterns) {
    const matched = pattern.regex.exec(key);
    if (matched)
      return String(
        i18n.t(
          pattern.key,
          Object.fromEntries(
            pattern.names.map((name, index) => [name, localize(matched[index + 1])])
          )
        )
      ) as T;
  }
  return value;
}
export function formatLocale(): string {
  const locale = i18n.language;
  return locale === 'ar' ? 'ar-u-nu-latn' : locale === 'en' ? 'en-US' : locale;
}
export function formatDate(value: string): string {
  if (i18n.language === 'en') return value.slice(0, 10);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(formatLocale(), {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}
