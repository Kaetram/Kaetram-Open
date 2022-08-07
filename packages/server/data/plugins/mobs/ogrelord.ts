import Default from './default';

import Mob from '@kaetram/server/src/game/entity/character/mob/mob';

import Utils from '@kaetram/common/util/utils';

export default class OgreLord extends Default {
    private dialogues: string[] = [
        'The great ogre lord will trample over you!',
        'No, do not touch my onions!'
    ];

    public constructor(mob: Mob) {
        super(mob);

        // Start the random dialogue interval and run it every 15 seconds.
        setInterval(() => this.randomDialogue(), 15_000);
    }

    /**
     * Picks a random dialogue text from the list and creates a talk
     * callback for the mob.
     */

    private randomDialogue(): void {
        if (!this.mob.combat.started) return;

        let dialogue = this.dialogues[Utils.randomInt(0, this.dialogues.length - 1)];

        this.mob.talkCallback?.(dialogue);
    }
}
