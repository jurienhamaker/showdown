/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { Dex, Teams, RandomPlayerAI, BattleStreams } from '@pkmn/sim';
import { Protocol, Handler, ArgName, ArgType, BattleArgsKWArgType } from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import { TeamGenerators } from '@pkmn/randoms';
import { LogFormatter } from '@pkmn/view';
import { Generations } from '@pkmn/data';
import { PreHandler } from '#handlers/prehandler';
import { PostHandler } from '#handlers/posthandler';
import type { MessageComponentInteraction } from 'discord.js';
import { moveChoice, updateBattleEmbed } from '#handlers/battlescreen';
import { default as removeMD } from 'remove-markdown';

export function initiateBattle(interaction: MessageComponentInteraction) {
	Teams.setGeneratorFactory(TeamGenerators);
	const gens = new Generations(Dex as any);

	const spec = { formatid: 'gen8randombattle' };
	const p1spec = { name: interaction.user.username, team: Teams.pack(Teams.generate('gen8randombattle')) };
	const p2spec = { name: 'Showdown! AI', team: Teams.pack(Teams.generate('gen8randombattle')) };

	const streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());

	const p2 = new RandomPlayerAI(streams.p2);
	p2.start();

	const battle = new Battle(gens);
	const formatter = new LogFormatter('p1', battle);

	const pre = new PreHandler(battle);
	const post = new PostHandler(battle);

	const add = <T>(h: Handler<T>, k: ArgName | undefined, a: ArgType, kw: BattleArgsKWArgType) => {
		if (k && k in h) (h as any)[k](a, kw);
	};

	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
	const waitFor = async function waitFor(f: any) {
		while (!f()) await sleep(1000);
		return f();
	};

	let battlelog: string[] = [];

	(async () => {
		for await (const chunk of streams.omniscient) {
			for (const line of chunk.split('\n')) {
				const { args, kwArgs } = Protocol.parseBattleLine(line);
				const text = formatter.formatText(args, kwArgs);
				const key = Protocol.key(args);

				add(pre, key, args, kwArgs);
				battle.add(args, kwArgs);
				add(post, key, args, kwArgs);

				if (text !== '') battlelog.push(removeMD(text));
				console.log(removeMD(text));
			}
			battle.update();
		}
	})();

	streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);

	(async () => {
		for await (const chunk of streams.p1) {
			for (const line of chunk.split('\n')) {
				const { args, kwArgs } = Protocol.parseBattleLine(line);
				battle.add(args, kwArgs);
			}
			battle.update();
			if (battle.request?.requestType === 'move') {
				await waitFor(() => battlelog.length !== 0);
				await updateBattleEmbed(battle, interaction, battlelog);
				await moveChoice(streams, battle, interaction);
				battlelog = [];
			}
			if (battle.request?.requestType === 'switch') {
				console.log('switch');
			}
		}
	})();
}
