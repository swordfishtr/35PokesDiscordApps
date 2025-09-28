/**
 * Control panel.
 */

import * as Util from './Utilities.js';
import * as readline from 'readline';
import bot from './Bot.js'

// Load other stuff here.

const rl = readline.createInterface(process.stdin, process.stdout);
rl.on('line', input);

Util.logTimestamp('Welcome to 35 Pokes Discord apps! Enter help for commands.');

async function input(cmd: string) {
	// TODO
	Util.logTimestamp(`Bot dump:\n${bot.dump()}`);
}
