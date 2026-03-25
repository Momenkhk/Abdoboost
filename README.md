# Abdo Càfe Premium Milestone Bot

Premium Nitro/Boost milestone cards for Discord using Node.js + discord.js components v2.

## Config (`config.json`)

All visual and runtime options are centralized in `config.json`:

- `bot.token` (Discord bot token)
- Brand title, footer, and embed color
- 9 milestone month breakpoints
- Canvas + timeline theme options
- Default Nitro/Boost emojis per level (1-9), updated directly by `-set-nitro` / `-set-boost` and saved in `config.json`

## Commands

- `-set-nitro <level> <emoji>`
- `-set-boost <level> <emoji>`
- `-nitro`
- `-boost`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Open `config.json` and set:

```json
"bot": {
  "token": "YOUR_DISCORD_BOT_TOKEN"
}
```

3. Start bot:

```bash
npm start
```

## Image verification (local)

```bash
npm run preview
```

This generates local files in `artifacts/` (ignored by git) so you can verify the final card style before deploying.

## Notes

- Boost start uses Discord's `premiumSinceTimestamp` when available.
- Nitro start is persisted when first requested because Discord does not expose Nitro subscription start date for bot users.
