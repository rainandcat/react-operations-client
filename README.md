# React Operations Client

A public React portfolio project for a focused client experience. It is a clean-room implementation that uses only locally authored mock data.

Current status: the activity list now uses a fully local mock API with URL-backed type filtering, pagination, and loading/error/empty states. Demo sign-in and protected navigation are also available. Activity detail, account data, notifications, and preferences remain planned. See [Product spec](docs/PRODUCT_SPEC.md).

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

In Activity, filter by fictional type and change pages. The “Demo state” control shows normal, empty, and service-error responses. No real network request is sent by the mock service.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

No real API, account, transaction, or personal data is used or accepted by this project.
