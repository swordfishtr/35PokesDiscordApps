# 35 Pokes Discord Apps

> [!CAUTION]
> This project is no longer maintained.

This is a Discord bot for the 35 Pokes Pokemon Showdown community.

## Features

`/chalcode`: Checks and transforms an input list of pokemon into a challenge code. It's useful for detecting typos and Pokemon forme related oversights.

`/live-usage-stats`: Periodically downloads usage stats and posts an embed into the specified channel. The source must be [35 Pokes Live Usage Stats](https://github.com/swordfishtr/35PokesLUS) or another server that responds with the expected JSON.

## Usage

Download this repository.

Copy a Pokemon Showdown `pokedex.js`, either from client or server, to `/data/pokedex.js`. You can download one from [main Pokemon Showdown](https://play.pokemonshowdown.com/data/pokedex.js). Get a fresh one whenever new Pokemon release.

Install npm and Node v24 from their website or via nvm.

Run `npm install`.

Run `npx tsc` - this will build the project to `/dist`.

Copy `config-sample.json` to `config.json` and fill it out.

Run `node dist/Controller.js`.

## config.json

`sudoers`: string[]

User IDs that bypass permission checks.

`bot.token`: string

Bot token

`bot.clientid`: string

Bot client ID

`bot.collectGarbage`: number

Interval duration for freeing expired data from the memory. In hours.

`bot.LiveUsageStats.interval`: number

Interval duration for fetching usage stats. In minutes. Do not set this to less than 6 (Discord rate limit).

## Credits

This project includes code from:

[Pokemon Showdown](https://github.com/smogon/pokemon-showdown)
