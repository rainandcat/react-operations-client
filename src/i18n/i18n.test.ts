// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  changeLocale,
  i18n,
  initializeLocale,
  languages,
  localize,
  savedLocale,
  translate
} from './index';

afterEach(async () => {
  localStorage.clear();
  await changeLocale('en', false);
});
describe('locale lifecycle', () => {
  it('defaults to English and only loads the selected resource', async () => {
    localStorage.clear();
    expect(savedLocale()).toBe('en');
    await initializeLocale();
    expect(translate('Recent trades')).toBe('Recent trades');
    expect(i18n.hasResourceBundle('ar', 'translation')).toBe(false);
  });
  it('translates stored content and interpolated feedback without rewriting data', async () => {
    await changeLocale('zh-TW');
    expect(localize('Activity completed')).toBe('活動已完成');
    expect(localize('5 fictional activities')).toBe('5 筆虛構活動');
    expect(localize('completed')).toBe('已完成');
    expect(translate('Page {{v0}} of {{v1}}', { v0: 2, v1: 3 })).toBe('第 2 頁，共 3 頁');
    expect(localStorage.getItem('operations-client-locale')).toBe('zh-TW');
  });
  it('supports Arabic direction and restores LTR on switching back', async () => {
    expect(languages.some((item) => item.value === 'ar')).toBe(true);
    await changeLocale('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(translate('Recent trades')).toBe('أحدث التداولات');
    for (const count of [0, 1, 2, 5, 20, 100]) {
      expect(translate('1 minute · UTC · {{v0}} candles', { v0: count })).toBe(
        `دقيقة واحدة · UTC · عدد الشموع: ${count}`
      );
    }
    await changeLocale('zh-CN');
    expect(document.documentElement.dir).toBe('ltr');
    expect(translate('Preferences')).toBe('偏好设置');
  });
  it('ignores invalid stored locales and lets the latest request win', async () => {
    localStorage.setItem('operations-client-locale', 'unknown');
    expect(savedLocale()).toBe('en');
    const older = changeLocale('zh-TW');
    const newer = changeLocale('zh-CN');
    await Promise.all([older, newer]);
    expect(i18n.language).toBe('zh-CN');
    expect(localStorage.getItem('operations-client-locale')).toBe('zh-CN');
  });
});
