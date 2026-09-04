/**
 * 35 Pokes Discord bot.
 * 
 * Scopes required:
 * applications.commands
 * bot
 * 
 * Bot permissions required:
 * view channels
 * send messages
 * send messages in threads
 * embed links
 * read message history
 */

import * as fs from 'fs';
import { Client, Events, GatewayIntentBits, MessageFlags, REST, Routes } from 'discord.js';
import * as Util from './Utilities.js';
import type BotCommand from './BotCommand.js';
import { Temporal } from '@js-temporal/polyfill';

declare module 'discord.js' {
	interface Client {
		config: any,
		/** Along with the type benefits, ensures that all properties below are loaded. */
		ready: Promise<Client<true>>,
		/** Subcommands handled within. */
		commands: Record<string, BotCommand>,
		/** toID from Pokemon Showdown */
		toID: (text: any) => string,
		/** pokedex.js from Pokemon Showdown */
		pokedex: any,
		/** 35PokesIndex */
		metagames: Record<string, Record<string, string[]>>,
		/** Print debug information. */
		dump: () => string,
	}
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.config = Util.importJSON(Util.root('..', 'config.json'));

client.ready = new Promise((res) => {
	client.once(Events.ClientReady, (readyClient) => {
		res(readyClient);
		Util.logTimestamp(
			`Bot login. Current guilds:${readyClient.guilds.cache.map((guild) => `\n- ${guild.name}`).join() || ' None.'}`
		);
	});
});

client.toID = (text: any) => {
	if (typeof text !== 'string') {
		if (text) text = text.id || text.userid || text.roomid || text;
		if (typeof text === 'number') text = `${text}`;
		else if (typeof text !== 'string') return '';
	}
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
};

client.commands = {};

client.pokedex = {};

client.metagames = {};

client.dump = () => {
	let buf = 'tbd';
	return buf;
};

export default client;

// we provided sane defaults synchronously above; in order to do async work now,
// we must enter an async function, since top-level-async is so janky.
// fortunately, discordjs can wait for our async work to be done before connecting.
// do not await this anonymous function, or else nodejs aborts!
(async function() {
	client.pokedex = require('./../data/pokedex.js').Pokedex;
	console.log(Object.keys(client.pokedex));

	for (const file of await fs.promises.readdir(Util.root('commands'))) {
		if (file.startsWith('_') || !file.endsWith('.js')) continue;
		const command = require(`./commands/${file}`).default as BotCommand;
		client.commands[command.metadata.name] = command;
	}
	console.log(Object.keys(client.commands));

	if (require.main === module && process.argv.includes('deploy')) {
		const commands = Object.values(client.commands).map((x) => x.metadata);
		Util.logTimestamp(`Deploying ${commands.length} bot commands:${commands.map((x) => `\n- ${x.name}`).join()}`);
		await new REST()
			.setToken(client.config.bot.token)
			.put(Routes.applicationCommands(client.config.bot.clientid), { body: commands });
		Util.logTimestamp('Success!');
		process.exit();
	}

	setInterval(() => {
		const now = Temporal.Now.instant().epochMilliseconds;
		Object.values(client.commands).forEach((x) => x.cleanCooldowns(now));
	}, (client.config.bot.collectGarbage || 6) * 60 * 60 * 1000);

	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isChatInputCommand()) return;
		if (!(interaction.commandName in client.commands)) {
			await interaction.reply({ content: 'Command not found.', flags: MessageFlags.Ephemeral });
			return;
		}
		await client.commands[interaction.commandName].execute(interaction);
	});

	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isAutocomplete()) return;
	});

	client.login(client.config.bot.token);

})();

// workaround hang on nodejs versions >22 <24
void 0;
