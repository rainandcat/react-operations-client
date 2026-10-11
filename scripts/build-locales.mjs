import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = new URL('../src/i18n/messages/', import.meta.url);
const output = new URL('../src/i18n/locales/', import.meta.url);
const locales = ['en', 'zh-TW', 'zh-CN', 'ar'];
const read = async (name) => JSON.parse(await readFile(new URL(name, directory), 'utf8'));
const english = await read('en.json');
const parameters = (value) =>
  [...value.matchAll(/\{\{(\w+)\}\}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');
await mkdir(fileURLToPath(output), { recursive: true });
for (const locale of locales) {
  const messages = locale === 'en' ? english : await read(`${locale}.json`);
  const fallback = locale === 'en' ? {} : await read(`${locale}.fallback.json`);
  for (const [key, value] of Object.entries(messages)) {
    if (!(key in english) || !value.trim() || parameters(value) !== parameters(english[key]))
      throw new Error(`Invalid translation: ${locale} / ${key}`);
  }
  for (const key of Object.keys(english)) {
    if (!(key in messages) && !fallback[key])
      throw new Error(`Undocumented fallback: ${locale} / ${key}`);
  }
  await writeFile(
    new URL(`${locale}.json`, output),
    JSON.stringify({ ...english, ...messages }, null, 2) + '\n'
  );
}
console.log(`Validated ${locales.length} locale bundles; English fallbacks merged at build time.`);
