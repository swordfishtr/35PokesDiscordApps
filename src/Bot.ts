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
import showdown from '../../pokemon-showdown/dist/sim/index.js';
import * as Util from './Utilities.js';
import type BotCommand from './BotCommand.js';
import { Temporal } from '@js-temporal/polyfill';

declare module 'discord.js' {
	interface Client {
		/** Along with the type benefits, ensures that all properties below are loaded. */
		ready: Promise<Client<true>>,
		/** Users that bypass rank checks. */
		sudoers: string[],
		/** Subcommands handled within. */
		commands: Record<string, BotCommand>,
		/** pokemon-showdown */
		showdown: typeof showdown,
		/** 35PokesIndex */
		metagames: Record<string, Record<string, string[]>>,
		/** Print debug information. */
		dump: () => string,
	}
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
export default client;

void async function(){
	client.ready = new Promise((res) => {
		client.once(Events.ClientReady, (readyClient) => {
			res(readyClient);
			Util.logTimestamp(
				`Bot login. Current guilds:${readyClient.guilds.cache.map((guild) => `\n- ${guild.name}`).join() || ' None.'}`
			);
		});
	});

	client.commands = {};
	for(const file of fs.readdirSync(Util.root('commands'))) {
		if(file.startsWith('_') || !file.endsWith('.js')) continue;
		const command: BotCommand = await Util.importDefault(Util.root('commands', file));
		client.commands[command.metadata.name] = command;
	}

	if(import.meta.main && process.argv.includes('deploy')) {
		const commands = Object.values(client.commands).map((x) => x.metadata);
		Util.logTimestamp(`Deploying ${commands.length} bot commands:${commands.map((x) => `\n- ${x.name}`).join()}`);
		const { clientid, token } = Util.importJSON(Util.root('..', 'config.json')).bot;
		await new REST().setToken(token).put(Routes.applicationCommands(clientid), { body: commands });
		Util.logTimestamp('Success!');
		process.exit();
	}

	setInterval(() => {
		const now = Temporal.Now.instant().epochMilliseconds;
		Object.values(client.commands).forEach((x) => x.cleanCooldowns(now));
	}, 60 * 60 * 1000); // TODO: config

	client.metagames = {};

	client.showdown = showdown;
	showdown.Dex.includeData();

	client.sudoers = Util.importJSON(Util.root('..', 'config.json')).sudoers;
	client.dump = () => {
		let buf = 'tbd';
		return buf;
	};

	client.on(Events.InteractionCreate, async (interaction) => {
		if(!interaction.isChatInputCommand()) return;
		if(!(interaction.commandName in client.commands)) {
			await interaction.reply({ content: 'Command not found.', flags: MessageFlags.Ephemeral });
			return;
		}
		await client.commands[interaction.commandName].execute(interaction);
	});

	client.on(Events.InteractionCreate, async (interaction) => {
		if(!interaction.isAutocomplete()) return;
	});

	client.login(Util.importJSON(Util.root('..', 'config.json')).bot.token);
}();
