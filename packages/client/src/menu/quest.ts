import Menu from './menu';

import log from '../lib/log';

import { Modules } from '@kaetram/common/network';

import type Player from '../entity/character/player/player';
import type { QuestPacketData } from '@kaetram/common/network/impl/quest';

export type AcceptCallback = (key: string) => void;

export default class Quest extends Menu {
    public override identifier: number = Modules.Interfaces.Quest;

    // Elements that we can update
    private title: HTMLElement = document.querySelector('#quest > .quest-title')!;
    private description: HTMLElement = document.querySelector('#quest > .quest-description')!;
    private rewards: HTMLElement = document.querySelector('#quest > .quest-rewards')!;
    private questButton: HTMLElement = document.querySelector('#quest-button')!;

    // Used for determining what type of quest interface we're dealing with.
    private activeQuest = ''; // Key of the currently active quest.

    private acceptCallback?: AcceptCallback;

    public constructor(private player: Player) {
        super('#quest', '#close-quest');

        this.questButton.addEventListener('click', () => {
            if (!this.activeQuest) return log.error('No active quest.');

            this.hide();

            this.acceptCallback?.(this.activeQuest);
        });
    }

    /**
     * Handles the incoming logic for the quest interface.
     * @param opcode Contains the type of quest interface action we're dealing with.
     * @param data Contains data about the quest interface.
     */

    public handle(data: QuestPacketData): void {
        // Attempt to find the quest in the player's quest list.
        let quest = this.player.quests[data.key!];

        if (!quest) return log.error(`Quest ${data.key} does not exist.`);

        this.activeQuest = data.key!;

        let [, description] = quest.description.split('|');

        // Update the quest interface with the quest data.
        this.title.innerHTML = quest.name;
        this.description.innerHTML = description;
        // TODO - Update rewards

        this.show();
    }

    /**
     * Callback for when the player clicks on the quest button.
     * @param callback Contains the quest interface action and the quest key.
     */

    public onAccept(callback: AcceptCallback): void {
        this.acceptCallback = callback;
    }
}
