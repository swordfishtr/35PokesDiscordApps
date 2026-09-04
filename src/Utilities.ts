/**
 * Utility exports. Do not import from project files here.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { Temporal } from '@js-temporal/polyfill';
import { type ChatInputCommandInteraction, GuildBasedChannel, GuildMember } from 'discord.js';

export enum Authority {
	UNVERIFIED,
	VERIFIED,
	SUPERVISER,
	MODERATOR,
	ADMINISTRATOR,
	SUDOER,
}

/** Does not get saved in the log. */
export class CommandError extends Error {}

export function getAuthority(interaction: ChatInputCommandInteraction) {
	if(interaction.client.config.sudoers.includes(interaction.user.id)) return Authority.SUDOER;
	const general = interaction.client.channels.cache.get('1128016692128260198') as GuildBasedChannel;
	const barracks = interaction.client.channels.cache.get('1145900216172687460') as GuildBasedChannel;
	if(general && barracks && (interaction.member instanceof GuildMember)) {
		if(interaction.member.permissionsIn(general).has('Administrator')) return Authority.ADMINISTRATOR;
		if(interaction.member.permissionsIn(general).has('BanMembers')) return Authority.MODERATOR;
		if(interaction.member.permissionsIn(barracks).has('ViewChannel')) return Authority.SUPERVISER;
		if(interaction.member.permissionsIn(general).has('ViewChannel')) return Authority.VERIFIED;
	}
	return Authority.UNVERIFIED;
}

export function logTimestamp(input: any) {
	const now = Temporal.Now.zonedDateTimeISO().toLocaleString();
	console.log(`[${now}] ${input}`);
}

/** Get path relative to `/path/to/project/dist` */
export function root(...paths: string[]) {
	return path.resolve(__dirname, ...paths);
}

/** No type definitions, but this doesn't cache and gets garbage collected. */
export function importJSON(m: string) {
	return JSON.parse(fs.readFileSync(m, { encoding: 'utf-8' }));
}

/** relaxed Object.keys */
export function	looseKeys<O extends {}>(o: O) {
	type Keys = keyof O;
	return Object.keys(o) as Keys[];
}

/** relaxed Object.entries */
export function	looseEntries<O extends {}>(o: O) {
	type Keys = keyof O;
	type Values = typeof o[Keys];
	return Object.entries(o) as [Keys, Values][];
}

/** throws child_process.ExecException | NodeJS.ErrnoException */
export function shell(cmd: string, cwd?: string): Promise<string> {
	return new Promise((res, rej) => {
		child_process.exec(cmd, { cwd }, (error, stdout, stderr) => {
			if(error) rej(error);
			res(stdout);
		});
	});
}
