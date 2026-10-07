# React Operations Client

A public React portfolio project for a focused client experience. It is a clean-room implementation that uses only locally authored mock data.

Current status: M1 navigation, responsive layout, and local demo sign-in are implemented. Data pages are navigation shells; mock API behavior arrives in M2. See [Product spec](docs/PRODUCT_SPEC.md).

## Planned scope

- Account overview and activity history
- Mock notifications and preferences
- Responsive navigation and accessible interface states
- Mock session handling

## Local development

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Use `member@demo.invalid` with passcode `demo123`. These are public demo strings, not real credentials. The session is stored only in browser session storage.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

No real API, account, transaction, or personal data is used or accepted by this project.
