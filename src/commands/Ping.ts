import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import BotCommand from "../BotCommand.js";
import * as Util from "../Utilities.js";

export default new class extends BotCommand {

	override minAuthority = Util.Authority.UNVERIFIED;

	override cooldownGlobal = 0;
	override cooldownPersonal = 0;

	override metadata = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Example command. Check whether the bot is online.');

	override interact(interaction: ChatInputCommandInteraction) {
		return interaction.reply({ content: 'pong', flags: MessageFlags.Ephemeral });
	}

}
