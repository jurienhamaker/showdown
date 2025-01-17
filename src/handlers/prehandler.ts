/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler, Protocol } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';
import type { Message, User } from 'discord.js';
import type { BattleStreams } from '#types/index';
import { switchChoice } from '#handlers/battlescreen';

export class PreHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(private readonly battle: Battle, private streams: BattleStreams, private message: Message, private user: User) {
		this.battle = battle;
		this.streams = streams;
		this.message = message;
		this.user = user;
	}

	async '|faint|'(args: Protocol.Args['|faint|']) {
		const poke = this.battle.getPokemon(args[1]);
		if (poke?.side === this.battle.p1) {
			console.log('fainted');
			await switchChoice(this.streams, this.battle, this.message, this.user);
		}
	}
}
