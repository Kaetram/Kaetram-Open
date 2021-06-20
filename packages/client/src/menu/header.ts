import $ from 'jquery';

import type Game from '../game';

export default class Header {
    private player = this.game.player;

    private health = $('#health');
    private healthBar = $('#healthBar');
    private healthBarText = $('#healthBarText');

    private exp = $('#exp');
    private expBar = $('#expBar');

    public constructor(private game: Game) {
        this.load();
    }

    private load(): void {
        this.player.onHitPoints(() => this.calculateHealthBar());

        this.player.onMaxHitPoints(() => this.calculateHealthBar());

        this.player.onExperience(() => this.calculateExpBar());
    }

    private calculateHealthBar(): void {
        const scale = this.getScale();
        const width = this.healthBar.width()!;

        // 11 is due to the offset of the #health in the #healthBar
        let diff = Math.floor(
            width * (this.player.hitPoints / this.player.maxHitPoints) - 11 * scale
        );
        const prevWidth = this.health.width()!;

        if (this.player.poison) this.toggle('poison');
        else this.toggle(diff - 1 > prevWidth ? 'green' : 'white');

        if (diff > width) diff = width;

        this.health.css('width', `${diff}px`);
        this.healthBarText.text(`${this.player.hitPoints}/${this.player.maxHitPoints}`);
    }

    private calculateExpBar(): void {
        // const scale = this.getScale();
        const width = this.expBar.width()!;

        const experience = this.player.experience - this.player.prevExperience;
        const nextExperience = this.player.nextExperience - this.player.prevExperience;
        const diff = Math.floor(width * (experience / nextExperience));

        this.exp.css('width', `${diff}px`);
    }

    public resize(): void {
        this.calculateHealthBar();
        this.calculateExpBar();
    }

    private getScale(): number {
        let scale = this.game.app.getUIScale();

        if (scale < 2) scale = 2;

        return scale;
    }

    private toggle(tClass: string): void {
        this.health.addClass(tClass);

        window.setTimeout(() => this.health.removeClass(tClass), 500);
    }
}
