import Player from '../entity/character/player/player';

/**
 * The header is the GUI on top of the screen that displays
 * the user's hitPoints, and exp bar. Every time there's
 * an update to the game's player, it gets relayed here.
 */

export default class Header {
    private health: HTMLElement = document.querySelector('#health')!; // The red element within the health bar.
    private healthBar: HTMLElement = document.querySelector('#health-bar')!;

    private text: HTMLElement = document.querySelector('#health-bar-text')!; // Numerical value of the health bar.

    private experience: HTMLElement = document.querySelector('#exp')!; // The green element within the exp bar.
    private experienceBar: HTMLElement = document.querySelector('#exp-bar')!; // Used for determining width of exp bar.

    private abilityBar: HTMLElement = document.querySelector('#ability-shortcut')!;

    public constructor(private player: Player) {
        this.player.onHitPoints(this.handleHitPoints.bind(this));
        this.player.onExperience(this.handleExperience.bind(this));
        this.player.onPoison(this.handlePoison.bind(this));
        this.player.onAbility(this.handleAbility.bind(this));
    }

    /**
     * Updates the health bar on the game screen.
     * @param hitPoints Current hit points of the player.
     * @param maxHitPoints Maximum attainable hit points (used to calcualte percentages).
     */

    private handleHitPoints(hitPoints: number, maxHitPoints: number, decrease?: boolean) {
        let percentage = hitPoints / maxHitPoints;

        this.health.style.width = `${Math.floor(
            this.healthBar.offsetWidth * percentage
        ).toString()}px`;

        this.text.textContent = `${hitPoints}/${maxHitPoints}`;

        if (decrease) this.flash('white');
    }

    /**
     * Updates the experience bar whenever the player acquires experience.
     * @param experience The current experience amount.
     * @param prevExperience Experience amount the current level starts at.
     * @param nextExperience The experience amount necessary for next level.
     */

    private handleExperience(experience: number, prevExperience: number, nextExperience: number) {
        let percentage = (experience - prevExperience) / (nextExperience - prevExperience);

        this.experience.style.width = `${Math.floor(
            this.experienceBar.offsetWidth * percentage
        ).toString()}px`;
    }

    /**
     * Updates the poison status by changing the colour of the health bar.
     * @param status The current status of the player's poison.
     */

    public handlePoison(status: boolean): void {
        this.health.style.background = status
            ? '-webkit-linear-gradient(right, #19B047, #046E20)'
            : '-webkit-linear-gradient(right, #ff0000, #ef5a5a)';
    }

    /**
     * Temporarily adds a class to the health (to give the visual
     * effect of it flashing) and creates a tiemout that removes
     * it after 500 milliseconds.
     */

    private flash(style: string): void {
        this.health.classList.add(style);

        window.setTimeout(() => this.health.classList.remove(style), 500);
    }

    /**
     * Handles the ability bar for when an ability has been added.
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

        // Reset to default class.
        quickSlotIndex.className = 'ability-quickslot';

        // Add the ability icon based on the key provided.
        quickSlotIndex.classList.add(`ability-icon-${key}`);
    }
}
