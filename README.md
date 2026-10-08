# React Operations Client

A public React portfolio project for a focused client experience. It is a clean-room implementation that uses only locally authored mock data.

Current status: account overview, activity list/detail, and notifications use an independent local mock API with URL-backed filters, sorting, pagination, and loading/error/empty states. Demo sign-in, protected navigation, and persistent display preferences are also available. See [Product spec](docs/PRODUCT_SPEC.md).

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

In Activity, filter and sort fictional records, change pages, and open a detail. Overview and Notifications also include independent fictional data. The “Demo state” controls show normal, empty, and service-error responses. No real network request is sent by the mock service.

Preferences offers light/dark appearance and comfortable/compact list spacing, stored only in this browser. Returning from a filtered activity detail preserves the URL filters. No real network request is sent by the mock service.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

No real API, account, transaction, or personal data is used or accepted by this project.
