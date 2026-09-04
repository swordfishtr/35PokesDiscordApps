import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import BotCommand from "../BotCommand.js";
import * as Util from "../Utilities.js";

export default new class extends BotCommand {

	override minAuthority = Util.Authority.UNVERIFIED;

	override cooldownGlobal = 0;
	override cooldownPersonal = 0;

	override metadata = new SlashCommandBuilder()
		.setName('chalcode')
		.setDescription('Converts a list of Pokemon into their precise formes for use in challenge codes.')
		.addSubcommand((s) => s
			.setName('ruleset')
			.setDescription('Output in "+pokemon1, +pokemon2, +pokemon3" format.')
			.addStringOption((o) => o
				.setName('list')
				.setDescription('Comma separated list of pokemon.')
				.setRequired(true)))
		.addSubcommand((s) => s
			.setName('array')
			.setDescription(`Output in "['pokemon1', 'pokemon2', 'pokemon3']" format.`)
			.addStringOption((o) => o
				.setName('list')
				.setDescription('Comma separated list of pokemon.')
				.setRequired(true)));

	override interact(interaction: ChatInputCommandInteraction) {
		const list = interaction.options.getString('list', true);
		switch (interaction.options.getSubcommand()) {
			case 'ruleset': return interaction.reply({ content: this.ruleset(list), flags: MessageFlags.Ephemeral });
			case 'array': return interaction.reply({ content: this.array(list), flags: MessageFlags.Ephemeral });
		}
		throw new Util.CommandError('Invalid subcommand.');
	}

	ruleset(list: string): string {
		return `+${this.toPreciseFormes(list).join(', +')}`;
	}

	array(list: string): string {
		return `['${this.toPreciseFormes(list).sort().join(`', '`)}']`;
	}

	toPreciseFormes(list: string): string[] {
		const { pokedex, toID } = this.client;
		return list
			.split(/[,\n]/)
			.map(toID)
			.map((x) => pokedex[x])
			.map((x) => {
				if (!x) return '???';
				// If base form and has non-cosmetic other formes and is not an exception
				// then return with suffix '-Base'.
				if (!x.baseSpecies && x.otherFormes && !this.formeExceptions.includes(x.id)) return `${x.name}-Base`;
				return x.name;
			});
	}

	/** Fully evolved species banned from 35 Pokes */
	banlist: string[] = [
		'aegislash', 'alakazammega', 'annihilape', 'arceus', 'arceusbug', 'arceusdark',
		'arceusdragon', 'arceuselectric', 'arceusfairy', 'arceusfighting', 'arceusfire', 'arceusflying',
		'arceusghost', 'arceusgrass', 'arceusground', 'arceusice', 'arceuspoison', 'arceuspsychic',
		'arceusrock', 'arceussteel', 'arceuswater', 'archaludon', 'azelf', 'baxcalibur',
		'blacephalon', 'blastoisemega', 'blaziken', 'blazikenmega', 'buzzwole', 'calyrexice',
		'celesteela', 'chienpao', 'chiyu', 'cinderace', 'cresselia', 'darkrai',
		'darmanitangalar', 'darmanitangalarzen', 'deoxys', 'deoxysattack', 'deoxysspeed', 'dialga',
		'dialgaorigin', 'dracovish', 'dragapult', 'dragonite', 'enamorus', 'enamorustherian',
		'eternatus', 'fluttermane', 'garchomp', 'genesect', 'genesectburn', 'genesectchill',
		'genesectdouse', 'genesectshock', 'gholdengo', 'giratina', 'giratinaorigin', 'gougingfire',
		'greattusk', 'greninja', 'greninjabond', 'groudon', 'groudonprimal', 'heatran',
		'hooh', 'hoopa', 'hoopaunbound', 'hydreigon', 'ironboulder', 'ironbundle',
		'ironcrown', 'ironhands', 'ironjugulis', 'ironleaves', 'ironmoth', 'irontreads',
		'ironvaliant', 'jirachi', 'kangaskhanmega', 'kartana', 'keldeo', 'keldeoresolute',
		'kingambit', 'kommoo', 'kyogre', 'kyogreprimal', 'kyurem', 'kyuremblack',
		'kyuremwhite', 'landorus', 'landorus', 'landorustherian', 'latias', 'latios',
		'lucariomega', 'lugia', 'lunala', 'magearna', 'magearnaoriginal', 'manaphy',
		'marshadow', 'melmetal', 'meloetta', 'meltan', 'meowscarada', 'metagrossmega',
		'mew', 'mewtwo', 'mewtwomegax', 'mewtwomegay', 'moltresgalar', 'naganadel',
		'necrozma', 'necrozmadawnwings', 'necrozmaduskmane', 'necrozmaultra', 'nihilego', 'ogerpon',
		'ogerponcornerstone', 'ogerponhearthflame', 'ogerponhearthflametera', 'ogerponwellspring', 'palafin', 'palafinhero',
		'palkia', 'palkiaorigin', 'pecharunt', 'pheromosa', 'pikachualola', 'pikachuhoenn',
		'pikachukalos', 'pikachuoriginal', 'pikachupartner', 'pikachusinnoh', 'pikachuunova', 'pikachuworld',
		'ragingbolt', 'raikou', 'rayquaza', 'regidrago', 'regieleki', 'reshiram',
		'roaringmoon', 'salamence', 'salamencemega', 'sandyshocks', 'screamtail', 'shayminsky',
		'slitherwing', 'sneasler', 'solgaleo', 'spectrier', 'suicune', 'tapubulu',
		'tapufini', 'tapukoko', 'tapulele', 'terapagos', 'terapagosstellar', 'terrakion',
		'thundurus', 'thundurustherian', 'tinglu', 'tornadus', 'tornadustherian', 'ursaluna',
		'ursalunabloodmoon', 'urshifu', 'urshifurapidstrike', 'victini', 'volcanion', 'volcarona',
		'walkingwake', 'xurkitree', 'yveltal', 'zacian', 'zaciancrowned', 'zamazenta',
		'zamazentacrowned', 'zapdos', 'zapdosgalar', 'zarude', 'zarudedada', 'zekrom',
		'zeraora', 'zygarde', 'zygardecomplete',
	];

	/** Not fully evolved species allowed in 35 Pokes */
	nfeExceptions: string[] = [
		'corsolagalar', 'dipplin', 'scyther', 'dusclops', 'bisharp', 'vigoroth',
		'dragonair', 'shelgon', 'arctibax', 'porygon2', 'rhydon', 'qwilfishhisui',
		'doublade', 'drakloak', 'trapinch', 'sneaselhisui', 'zweilous', 'pupitar',
		'basculinwhitestriped', 'primeape', 'duraludon', 'sinistcha',
	];

	/** Species with non-cosmetic other formes that are considered cosmetic for tiering purposes */
	formeExceptions: string[] = [
		'dudunsparce', 'maushold', 'meowstic', 'poltchageist', 'polteageist', 'silvally',
		'sinistcha', 'sinistea', 'squawkabilly', 'vivillon',
	];

	LC_banlist: string[] = [
		'basculinwhitestriped', 'duraludon', 'girafarig', 'primeape', 'typenull',
	];

}
