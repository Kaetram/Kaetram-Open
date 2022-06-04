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

    public constructor(private player: Player) {
        this.player.onHitPoints(this.handleHitPoints.bind(this));
        this.player.onExperience(this.handleExperience.bind(this));
    }

    /**
     * Updates the health bar on the game screen.
     * @param hitPoints Current hit points of the player.
     * @param maxHitPoints Maximum attainable hit points (used to calcualte percentages).
     */

    private handleHitPoints(hitPoints: number, maxHitPoints: number, decrease?: boolean) {
        let percentage = hitPoints / maxHitPoints;

        if (decrease) this.flash('white');

        this.health.style.width = `${Math.floor(
            this.healthBar.getBoundingClientRect().width * percentage
        ).toString()}px`;

        this.text.textContent = `${hitPoints}/${maxHitPoints}`;
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
            this.experienceBar.getBoundingClientRect().width * percentage
        ).toString()}px`;
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
}
