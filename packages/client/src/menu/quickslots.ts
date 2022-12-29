import type Player from '../entity/character/player/player';

export default class QuickSlots {
    private abilityBar: HTMLElement = document.querySelector('#ability-shortcut')!;

    /**
     * The quick slots are used by the special abilities. This is the menu
     * at the bottom of the screen that is displayed when a player first
     * acquires an ability.
     */

    public constructor(private player: Player) {
        this.player.onAbility(this.handleAbility.bind(this));
    }

    /**
     * Responsible for handling updates in the quick slot menu. Generally when we want
     * to update which ability is in a quick slot, it must pass through this function
     * in order to organize it.
     */

    private handleAbility(key: string, level: number, quickSlot = -1): void {
        this.abilityBar.hidden = false;

        // This is in order to give the ability bar a fade in effect when it first appears.
        setTimeout(() => (this.abilityBar.style.opacity = '1'), 100);

        // No quick slot identification.
        if (quickSlot === -1) return;

        // We use the quickslot index to determine which ability to update.
        let quickSlotIndex = this.abilityBar.children[quickSlot];

        if (!quickSlotIndex) return;

        // Remove the old ability icon from other icons.
        this.clean(key);

        // Reset to default class.
        quickSlotIndex.className = 'ability-quickslot';

        // Add the ability icon based on the key provided.
        quickSlotIndex.classList.add(`quickslot-icon-${key}`);
    }

    /**
     * Iterates through all the quick slot abilities and checks if another quick slot
     * already contains the ability icon. This is in order to prevent duplicate icons.
     * @param key The key we are checking for.
     */

    private clean(key: string): void {
        for (let child of this.abilityBar.children)
            if (child.classList.contains(`quickslot-icon-${key}`))
                child.classList.remove(`quickslot-icon-${key}`);
    }
}
