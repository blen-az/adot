# Adot Complex

Bilingual (English and Amharic) public website and staff dashboard. See `docs/technical-design.md` for the stack, decisions and delivery phases.

## Run locally

Requires Node 24. No database install is needed: without `DATABASE_URL`, the app uses embedded Postgres in `~/.adot-dev`.

```sh
npm install
cp .env.example .env.local
npm run db:seed   # creates sample data and prints the staff password
npm run dev
```

- Public site: http://localhost:3000
- Dashboard: http://localhost:3000/admin

The embedded database allows one process at a time, so stop the dev server before running `npm run db:seed`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Business-rule tests against in-memory Postgres |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |

Migrations run automatically when the app first connects to the database.

## Simulating a mail outage

Set `MAIL_SIMULATE_FAILURE=1` and submit an enquiry. The lead is saved and the enquiry page shows the failed notification. Unset it, restart, and use Retry. Emails are only logged until a provider is chosen (O-09).

## Design credit

The visual style is adapted from [Design Marketing Company Portfolio](https://www.figma.com/community/file/1599464623928426429) by rofaida ezzat, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). It was rebuilt with shadcn/ui for the Adot Complex site.
