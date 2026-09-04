# Contributing to dcuobot-bot

Thanks for wanting to contribute! This covers setup and conventions specific
to this repo. For the general workflow (branching, PR process, code of
conduct), see the [org-wide CONTRIBUTING.md](https://github.com/DCUOBot/.github/blob/main/CONTRIBUTING.md).

## Prerequisites

- Node.js >= 24 (see `engines` in `package.json`)
- npm

## Setup

1. Clone the repo:
   ```
   git clone https://github.com/DCUOBot/dcuobot-bot.git
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the required values (at minimum
   `DISCORD_TOKEN` from https://discord.com/developers/applications).
4. Run it locally:
   ```
   npm run dev
   ```
   This runs the bot with `tsx --watch`, restarting on file changes. Use
   `npm start` for a one-off run without watching.

## Project structure

Commands and buttons are auto-discovered at startup: every file in
`src/commands/` and `src/buttons/` is loaded and registered by name, so
adding a new one is just adding a file — no manual registration step.

```
src/
├── commands/    # slash commands, one per file: <name>.command.ts
├── buttons/     # button interaction handlers: <name>.button.ts
├── handlers/    # command/button loaders + shared command builders
├── helpers/     # embed builders and other logic, grouped by domain
│   ├── character/
│   ├── guild/
│   ├── info/
│   ├── lfg/
│   ├── ranking/
│   ├── servers/
│   └── *.ts     # generic/cross-cutting helpers (embed base, sorting, etc.)
├── lib/         # config, logger, API client
├── models/      # API response types, grouped by domain
├── structures/  # BotClient and other core classes
└── types/       # shared Command/Button interfaces
```

Within `helpers/`, put domain-specific logic in that domain's subfolder
rather than the `helpers/` root — the root is reserved for helpers used
across multiple domains. When adding a new domain (a new command family),
give it its own subfolder rather than dropping files into an existing one.

## Coding conventions

- **Commands** implement the `Command` interface (`src/types/command.ts`):
  a `data` property (a `SlashCommandBuilder`) and an `execute` method. Name
  the file `<name>.command.ts`.
- **Buttons** implement the `Button` interface (`src/types/button.ts`):
  a `customId` and an `execute` method. Name the file `<name>.button.ts`.
- Reuse the shared command builders (`build-lookup-command.ts`,
  `build-ranking-command.ts`) in `src/handlers/` where a new command fits
  the lookup or ranking shape, instead of hand-rolling another
  `SlashCommandBuilder`.
- Build embeds with `buildEmbed()` from `src/helpers/embed-helpers.ts`
  rather than `new EmbedBuilder()` directly, so styling (color, author,
  timestamp) stays consistent.
- Follow existing naming and folder conventions in the area you're
  touching rather than introducing a new pattern.

## Testing

- Every command, button, and helper has a colocated `*.spec.ts` file. Add
  or update one for any new/changed behavior.
- Run the full test suite before opening a PR:
  ```
  npm test
  ```
- Run lint and formatting checks:
  ```
  npm run lint
  npm run format:check
  ```
  A pre-commit hook runs these automatically on staged files, but it's
  worth running them yourself before pushing.

## Opening a PR

PR titles are linted and must follow
[Conventional Commits](https://www.conventionalcommits.org/) (e.g.
`feat: add topcharacters command`, `fix: correct league URL encoding`) —
they drive the automated changelog.

Please make sure:

- [ ] `npm run lint` and `npm run format:check` pass
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] New/changed commands and buttons have corresponding tests
- [ ] New code follows the folder structure and conventions above

## Questions

Open a discussion or issue if anything here is unclear.
