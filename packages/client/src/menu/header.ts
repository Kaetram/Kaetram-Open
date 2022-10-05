import Player from '../entity/character/player/player';

/**
 * The header is the GUI on top of the screen that displays
 * the user's hitPoints, and exp bar. Every time there's
 * an update to the game's player, it gets relayed here.
 */

export default class Header {
    private health: HTMLElement = document.querySelector('#health')!; // The red element within the health bar.
    private healthBar: HTMLElement = document.querySelector('#health-bar')!;

    private mana: HTMLElement = document.querySelector('#mana')!;
    private manaBar: HTMLElement = document.querySelector('#mana-bar')!;

    private healthText: HTMLElement = document.querySelector('#health-bar-text')!; // Numerical value of the health bar.
    private manaText: HTMLElement = document.querySelector('#mana-bar-text')!;

    private experience: HTMLElement = document.querySelector('#exp')!; // The green element within the exp bar.
    private experienceBar: HTMLElement = document.querySelector('#exp-bar')!; // Used for determining width of exp bar.

    // Stored and updated every time experience change occurs, we store it for use during resizing.
    private prevExperience = 0;
    private nextExperience = 0;

    public constructor(private player: Player) {
        this.player.onHitPoints(this.handleHitPoints.bind(this));
        this.player.onMana(this.handleMana.bind(this));
        this.player.onExperience(this.handleExperience.bind(this));
        this.player.onPoison(this.handlePoison.bind(this));
    }

    /**
     * Updates the health bar on the game screen.
     * @param hitPoints Current hit points of the player.
     * @param maxHitPoints Maximum attainable hit points (used to calcualte percentages).
     * @param decrease Whether or not the hit points are decreasing.
     */

    private handleHitPoints(hitPoints: number, maxHitPoints: number, decrease?: boolean): void {
        this.setPoints(
            this.health,
            this.healthBar,
            this.healthText,
            hitPoints,
            maxHitPoints,
            decrease
        );
    }

    /**
     * Updates the mana bar on the game screen.
     * @param mana Current mana of the player.
     * @param maxMana Maximum attainable mana (used to calcualte percentages).
     */

    public handleMana(mana: number, maxMana: number): void {
        this.setPoints(this.mana, this.manaBar, this.manaText, mana, maxMana);
    }

    /**
     * Updates the experience bar whenever the player acquires experience.
     * @param experience The current experience amount.
     * @param prevExperience Experience amount the current level starts at.
     * @param nextExperience The experience amount necessary for next level.
     */

    private handleExperience(
        experience: number,
        prevExperience: number,
        nextExperience: number
    ): void {
        let percentage = (experience - prevExperience) / (nextExperience - prevExperience);

        this.experience.style.width = `${Math.floor(
            this.experienceBar.offsetWidth * percentage
        ).toString()}px`;

        this.prevExperience = prevExperience;
        this.nextExperience = nextExperience;
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
     * Updates the width of all the bars when the window is resized.
     */

    public resize(): void {
        this.handleHitPoints(this.player.hitPoints, this.player.maxHitPoints);
        this.handleMana(this.player.mana, this.player.maxMana);
        this.handleExperience(this.player.experience, this.prevExperience, this.nextExperience);
    }

    /**
     * Function that updates a specified element and its text value
     * based on the points data provided.
     * @param element The element we are updating the width of.
     * @param barElement Used to compare against the element's width.
     * @param textElement The text element we are adding the points info to.
     * @param points The points value we are updating the element with.
     * @param maxPoints The maximum points value.
     * @param decrease Whether or not the points value is decreasing.
     */

    private setPoints(
        element: HTMLElement,
        barElement: HTMLElement,
        textElement: HTMLElement,
        points: number,
        maxPoints: number,
        decrease?: boolean
    ): void {
        let percentage = points / maxPoints;

        element.style.width = `${Math.floor(barElement.offsetWidth * percentage).toString()}px`;

        textElement.textContent = `${points}/${maxPoints}`;

        if (decrease) this.flash('white');
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
