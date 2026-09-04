import * as fs from 'fs';
import { ChannelType, type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import BotCommand from "../BotCommand.js";
import * as Util from "../Utilities.js";

/** room id, 12 pokemon id */
type StatsData = Record<string, string[]>;

export default new class extends BotCommand {

	configPath = Util.root('..', 'data', 'LiveUsageStats.json');

	override minAuthority = Util.Authority.ADMINISTRATOR;

	override cooldownGlobal = 0;
	override cooldownPersonal = 0;

	override metadata = new SlashCommandBuilder()
		.setName('live-usage-stats')
		.setDescription('Posts live usage stats collected from 35PokesPSBot.')
		.addSubcommand((s) => s
			.setName('list')
			.setDescription('Prints all subscribed channels.')
			.addChannelOption((o) => o
				.setName('channel')
				.setDescription('Prints whether this channel is subscribed.')))
		.addSubcommand((s) => s
			.setName('create')
			.setDescription('Subscribes a channel.')
			.addChannelOption((o) => o
				.setName('channel')
				.setDescription('Channel to subscribe.')
				.addChannelTypes([
					ChannelType.GuildAnnouncement,
					ChannelType.AnnouncementThread,
				])
				.setRequired(true))
			.addStringOption((o) => o
				.setName('url')
				.setDescription('URL of the data endpoint.')
				.setRequired(true)))
		.addSubcommand((s) => s
			.setName('delete')
			.setDescription('Unsubscribes a channel.')
			.addChannelOption((o) => o
				.setName('channel')
				.setDescription('Channel to unsubscribe.')
				.setRequired(true)));

	override interact(interaction: ChatInputCommandInteraction) {
		switch (interaction.options.getSubcommand()) {
			case 'list': return this.list(interaction);
			case 'create': return this.create(interaction);
			case 'delete': return this.delete(interaction);
		}
		throw new Util.CommandError('Invalid subcommand.');
	}

	async list(interaction: ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', false);
		if (channel) {
			if (channel.id in this.channels) {
				return interaction.reply(`<#${channel.id}> is subscribed to ${this.channels[channel.id]}`);
			}
			else {
				return interaction.reply(`<#${channel.id}> is not subscribed.`);
			}
		}
		const out = Object
			.entries(this.channels)
			.map(([id, url]) => `<#${id}> is subscribed to ${url}`)
			.join('\n') || 'There are no subscriptions currently.';
		return interaction.reply(out);
	}

	async create(interaction: ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', true, [
			ChannelType.GuildAnnouncement,
			ChannelType.AnnouncementThread,
		]);
		if (channel.id in this.channels) {
			throw new Util.CommandError(`<#${channel.id}> is currently subscribed to ${this.channels[channel.id]}`);
		}
		const url = new URL(interaction.options.getString('url', true));
		if (!['http:', 'https:'].includes(url.protocol)) {
			throw new Util.CommandError('Invalid URL protocol.');
		}
		this.channels[channel.id] = url;
		this.save();
		this.update(channel.id);
		return interaction.reply(`<#${channel.id}> has been subscribed to ${url}`);
	}

	async delete(interaction: ChatInputCommandInteraction) {
		const channel = interaction.options.getChannel('channel', true);
		if (!(channel.id in this.channels)) {
			throw new Util.CommandError(`<#${channel.id}> is not subscribed.`);
		}
		delete this.channels[channel.id];
		this.save();
		return interaction.reply(`<#${channel.id}> has been unsubscribed.`);
	}

	save() {
		return fs.promises.writeFile(this.configPath, JSON.stringify(this.channels));
	}

	constructor() {
		super();
		try {
			const config = Util.importJSON(this.configPath);
			for (const channel in config) {
				config[channel] = new URL(config[channel]);
			}
			this.channels = config;
		}
		catch {}
	}

	/** channel.id (snowflake), data url like `http://us3.bot-hosting.net:20984/2025/2025_09` */
	channels: Record<string, URL> = {};

	interval = setInterval(async () => {
		for (const id in this.channels) {
			await this.update(id);
		}
	}, (this.client.config.bot.LiveUsageStats.interval || 60) * 60 * 1000);

	async update(id: string) {
		const channel = this.client.channels.cache.get(id);
		if (!channel || !(
			channel.type === ChannelType.GuildAnnouncement ||
			channel.type === ChannelType.AnnouncementThread
		)) return;
		try {
			const response = await fetch(this.channels[id]);
			if (!response.ok) throw new Error();
			const data: StatsData = await response.json();
			const out = this.parseStats(data);
			const message = await channel.send({ embeds: [out] });
			if (message.crosspostable) await message.crosspost();
		}
		catch {
			try {
				await channel.send('Failed to parse usage stats.');
			}
			catch (error) {
				Util.logTimestamp(error);
			}
		}
	}

	parseStats(data: StatsData) {
		const {pokedex, toID} = this.client;

		const allPokemon = Object.values(data).flat();
		const totalBattles = Object.keys(data).length;
		const totalTeams = totalBattles * 2;

		const stats: Record<string, number> = {};
		for (const pokemon of allPokemon) {
			stats[pokemon] ??= 0;
			stats[pokemon]++;
		}

		const ranked = Object
			.entries(stats)
			.sort((a, b) => a[1] - b[1])
			.reverse();

		const description = ranked
			.map(([id, n], i) => `${i + 1}. **${pokedex[id].name}**: ${((n / totalTeams) * 100).toFixed(2)}%`)
			.slice(0, 100)
			.join('\n');

		const embed = new EmbedBuilder()
			.setTitle('**Usage Stats**')
			.setColor(0x5ABD8B)
			.setDescription(description)
			.setFooter({ text: `From ${totalBattles} public battles` });

		if (ranked[0]) {
			let spriteid = 'unown-qm';
			const species = pokedex[ranked[0][0]];
			if (species) {
				const baseSpecies = species.baseSpecies || species.name;
				spriteid = toID(baseSpecies) + (baseSpecies !== species.name ? `-${toID(species.forme)}` : '');
			}
			embed.setThumbnail(`https://play.pokemonshowdown.com/sprites/gen5/${spriteid}.png`);
		}

		return embed;
	}

}
