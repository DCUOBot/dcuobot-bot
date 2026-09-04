# dcuobot-bot

[![CI](https://github.com/DCUOBot/dcuobot-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/DCUOBot/dcuobot-bot/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DCUOBot_dcuobot-bot&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DCUOBot_dcuobot-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Discord bot for **DCUOBot**. It brings [DC Universe
Online](https://www.dcuniverseonline.com/) character/league lookups,
rankings, server status, and a looking-for-group finder into Discord as
slash commands, backed by [dcuobot-api](https://github.com/DCUOBot/dcuobot-api)
for the underlying Census game data.

## Features

- **Character & league lookups** — skill points, combat rating, stats, and
  league membership via `/character`, `/statistics`, and `/league`.
- **Rankings** — top characters and top leagues leaderboards, sortable by
  stat, via `/topcharacters` and `/topleagues`.
- **Server status** — live DCUO server status via `/servers`.
- **LFG group finder** — `/lfg` posts an embed with per-role sign-up
  buttons (tank/healer/controller/DPS); players click to join or leave and
  the embed updates live as slots fill.
- **Self-documenting help** — `/dcuobot` lists every currently loaded
  command with its description and arguments, built from the commands
  themselves so it can't drift out of date.
- **Auto-discovery** — commands and buttons are loaded from `src/commands`
  and `src/buttons` at startup; adding a new file registers it, no manual
  wiring required.

## Tech stack

- Node.js 24, TypeScript
- [discord.js](https://discord.js.org/)
- Axios (dcuobot-api client)
- Pino (structured logging)
- Vitest (testing)

## Commands

| Command          | Description                                                     | Arguments                                                                                         |
| ---------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/character`     | Look up a character's skill points, combat rating, and more.    | `name`, `server`                                                                                  |
| `/statistics`    | Look up a character's stats (health, power, might, etc.).       | `name`, `server`                                                                                  |
| `/league`        | Look up a league's average skill points, members, etc.          | `name`, `server`                                                                                  |
| `/topcharacters` | See the top characters ranking.                                 | `server`, `sortby`                                                                                |
| `/topleagues`    | See the top leagues ranking.                                    | `server`, `sortby`                                                                                |
| `/lfg`           | Create a looking-for-group embed with sign-up buttons per role. | `instance_name`, `amount_of_tanks`, `amount_of_healers`, `amount_of_controllers`, `amount_of_dps` |
| `/servers`       | Check the DC Universe Online server status.                     | –                                                                                                 |
| `/info`          | Bot info (Discord API ping, uptime).                            | –                                                                                                 |
| `/dcuobot`       | List all available commands, their descriptions, and arguments. | –                                                                                                 |

All listed arguments are required. `server` accepts `US`, `EU`, `SwitchUS`,
`SwitchEU`, or `Xbox`; ranking commands also accept `all` to combine every
server. `sortby` accepts a stat key — e.g. `sp`, `cr`, `pvpcr`, `health`,
`power` for `/topcharacters`, or `avgsp`, `avgcr`, `avgpvpcr`, `members` for
`/topleagues`. Run `/dcuobot` in Discord for the live, always up-to-date
list.

## Getting started

```
git clone https://github.com/DCUOBot/dcuobot-bot.git
npm install
cp .env.example .env   # fill in DISCORD_TOKEN
npm run dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full dev setup, project
structure, and coding conventions.

### Requirements

- Node.js >= 24
- A Discord bot token from the
  [Discord Developer Portal](https://discord.com/developers/applications),
  invited with the `bot` and `applications.commands` scopes
- Access to a DCUOBot API instance for Census data (defaults to the public
  `https://dcuo.bot/api/v1/census`; point `src/lib/config.ts` at a local
  [dcuobot-api](https://github.com/DCUOBot/dcuobot-api) instance if running
  one)

### Configuration

Set via environment variables (see `.env.example`):

| Variable        | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| `DISCORD_TOKEN` | Discord bot token                                                             |
| `LOG_LEVEL`     | Optional: Pino log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |
| `NODE_ENV`      | Optional: set to `production` to disable pretty-printed logs                  |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
