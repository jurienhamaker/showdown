/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler, Protocol } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';
import { waitFor } from '#util/functions';
import { moveChoice, switchChoice, updateBattleEmbed } from '#handlers/battlescreen';
import type { Message, User } from 'discord.js';
import type { BattleStreams } from '#types/index';

export class PostHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(private readonly battle: Battle, private streams: BattleStreams, private message: Message, private user: User) {
		this.battle = battle;
		this.streams = streams;
		this.message = message;
		this.user = user;
	}

	'|teampreview|'() {
		console.log('teampreview');
	}

	async '|turn|'() {
		console.log('turn');
		if (this.battle.request?.requestType === 'move') {
			await waitFor(() => process.battlelog.length !== 0);
			await updateBattleEmbed(this.battle, this.message);
			await moveChoice(this.streams, this.battle, this.message, this.user);
		} else if (this.battle.request?.requestType === 'switch') {
			console.log('switchchoice');
			await waitFor(() => process.battlelog.length !== 0);
			await switchChoice(this.streams, this.battle, this.message, this.user);
		} else if (this.battle.request?.requestType === 'wait') {
			await waitFor(() => process.battlelog.length !== 0);
			await updateBattleEmbed(this.battle, this.message);
		}
	}

	async '|switch|'(args: Protocol.Args['|switch|']) {
		console.log('switch event');
		console.log(args);
		const poke = this.battle.getPokemon(args[1]);
		if (poke?.side === this.battle.p1 && this.battle.p1.lastPokemon) {
			console.log('switch done');
			console.log('updating battle embed');
			if (this.battle.p1.active[0]?.name === this.battle.p1.lastPokemon.name) {
				this.battle.p1.active[0] = this.battle.p1.lastPokemon;
				await updateBattleEmbed(this.battle, this.message);
			}
		}
	}

	async '|win|'(args: Protocol.Args['|win|']) {
		console.log(args);
		process.battlelog.push(`${args[1]} won the battle!`);
		await updateBattleEmbed(this.battle, this.message, []);
	}

	async '|tie|'(args: Protocol.Args['|tie|']) {
		console.log(args);
		process.battlelog.push(`The battle ended in a tie!`);
		await updateBattleEmbed(this.battle, this.message, []);
	}

	'|detailschange|'(args: Protocol.Args['|detailschange|']) {
		console.log('detailschange event');
		console.log(args);
	}

	'|-formechange|'(args: Protocol.Args['|-formechange|']) {
		console.log('formechange event');
		console.log(args);
	}

	'|-start|'(args: Protocol.Args['|-start|']) {
		console.log('-start event');
		console.log(args);
		// looks like this: [ '-start', 'p1a: Dracozolt', 'Dynamax' ]
		// destructure index 1 and 2
		const [, pokemon, effect] = args;
		// if effect is Dynamax or Gmax, and the pokemon is on side p1a, then set process.isMax to true
		if (effect === 'Dynamax' || effect === 'Gmax') {
			if (pokemon.startsWith('p1a')) {
				process.isMax = true;
			}
		}
	}

	'|-end|'(args: Protocol.Args['|-end|']) {
		console.log('-end event');
		console.log(args);
		// looks like this: [ '-end', 'p1a: Dracozolt', 'Dynamax' ]
		// destructure index 1 and 2
		const [, pokemon, effect] = args;
		// if effect is Dynamax or Gmax, and the pokemon is on side p1a, then set process.isMax to false
		if (effect === 'Dynamax' || effect === 'Gmax') {
			if (pokemon.startsWith('p1a')) {
				process.isMax = false;
			}
		}
	}
}
