import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import BotCommand from "../BotCommand.js";
import * as Util from "../Utilities.js";

export default new class extends BotCommand {

	override minAuthority = Util.Authority.UNVERIFIED;

	override cooldownGlobal = 0;
	override cooldownPersonal = 0;

	override metadata = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Prints command usage information.')
	.addStringOption((o) => o
		.setName('command')
		.setDescription('Comma separated list of pokemon')
		.addChoices(
			{ name: 'chalcode', value: 'chalcode' },
			{ name: 'live-usage-stats', value: 'live-usage-stats' },
		));

	override interact(interaction: ChatInputCommandInteraction) {
		const command = interaction.options.getString('command', false);
		if(command) {
			if(!(command in this.help)) throw new Util.CommandError('There is no help text for this command.');
			return interaction.reply(this.help[command]);
		}
		const out = Object.entries(this.help).map(([name, text]) => `${name} usage:\n${text}`).join('\n\n');
		return interaction.reply(out);
	}

	help: Record<string, string> = {
		'chalcode': [
			'tbd',
		].join('\n'),
		'live-usage-stats': [
			'tbd',
		].join('\n'),
	};

}
