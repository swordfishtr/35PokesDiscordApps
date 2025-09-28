import { Temporal } from "@js-temporal/polyfill";
import { type ChatInputCommandInteraction, MessageFlags, type SharedSlashCommand } from "discord.js";
import * as Util from "./Utilities.js";
import client from "./Bot.js";

export default abstract class BotCommand {

	client = client;

	abstract metadata: SharedSlashCommand;
	abstract interact(interaction: ChatInputCommandInteraction): Promise<any>;

	abstract minAuthority: Util.Authority;

	// in ms
	abstract cooldownGlobal: number;
	abstract cooldownPersonal: number;

	// timestamps in ms
	lastUsedGlobal: number = 0;
	lastUsedPersonal: Record<string, number> = {};

	checkAuthority(interaction: ChatInputCommandInteraction) {
		if(Util.getAuthority(interaction) < this.minAuthority) {
			throw new Util.CommandError('Permission denied.');
		}
	}

	checkCooldownGlobal() {
		if(this.cooldownGlobal > 0) {
			const now = Temporal.Now.instant().epochMilliseconds;
			const remaining = this.cooldownGlobal - (now - this.lastUsedGlobal);
			if(remaining > 0) {
				throw new Util.CommandError(`On global cooldown (${Math.floor(remaining / 1000)} seconds remaining).`);
			}
			this.lastUsedGlobal = now;
		}
	}
	checkCooldownPersonal(id: string) {
		if(this.cooldownPersonal > 0 && (id in this.lastUsedPersonal)) {
			const now = Temporal.Now.instant().epochMilliseconds;
			const remaining = this.cooldownPersonal - (now - this.lastUsedPersonal[id]);
			if(remaining > 0) {
				throw new Util.CommandError(`On personal cooldown (${Math.floor(remaining / 1000)} seconds remaining).`);
			}
			this.lastUsedPersonal[id] = now;
		}
	}
	/** Called in an interval in Bot.ts */
	cleanCooldowns(since: number) {
		if(this.cooldownPersonal) {
			for(const id in this.lastUsedPersonal) {
				const remaining = this.cooldownPersonal - (since - this.lastUsedPersonal[id]);
				if(remaining <= 0) {
					delete this.lastUsedPersonal[id];
				}
			}
		}
	}

	async execute(interaction: ChatInputCommandInteraction) {
		try {
			this.checkCooldownGlobal();
			this.checkCooldownPersonal(interaction.user.id);
			this.checkAuthority(interaction);
			await this.interact(interaction);
		}
		catch(error: any) {
			await interaction.reply({ content: `Error: ${error?.message}`, flags: MessageFlags.Ephemeral });
			if(error instanceof Util.CommandError) return;
			Util.logTimestamp(error?.stack);
		}
	}

}
