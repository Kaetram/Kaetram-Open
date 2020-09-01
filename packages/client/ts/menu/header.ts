import $ from 'jquery';
import Game from '../game';
import MenuController from '../controllers/menu';
import Player from '../entity/character/player/player';

export default class Header {
    game: Game;
    player: Player;
    health: JQuery<HTMLElement>;
    healthBar: JQuery<HTMLElement>;
    healthBarText: JQuery<HTMLElement>;
    exp: JQuery<HTMLElement>;
    expBar: JQuery<HTMLElement>;
    constructor(game: Game, menu: MenuController) {
        this.game = game;
        this.player = game.player;

        this.health = $('#health');
        this.healthBar = $('#healthBar');
        this.healthBarText = $('#healthBarText');

        this.exp = $('#exp');
        this.expBar = $('#expBar');

        this.load();
    }

    load(): void {
        this.player.onHitPoints(() => {
            this.calculateHealthBar();
        });

        this.player.onMaxHitPoints(() => {
            this.calculateHealthBar();
        });

        this.player.onExperience(() => {
            this.calculateExpBar();
        });
    }

    calculateHealthBar(): void {
        const scale = this.getScale(),
            width = this.healthBar.width();

        //11 is due to the offset of the #health in the #healthBar
        let diff = Math.floor(
            width * (this.player.hitPoints / this.player.maxHitPoints) - 11 * scale
        );
        const prevWidth = this.health.width();

        if (this.player.poison) this.toggle('poison');
        else this.toggle(diff - 1 > prevWidth ? 'green' : 'white');

        if (diff > width) diff = width;

        this.health.css('width', `${diff}px`);
        this.healthBarText.text(`${this.player.hitPoints}/${this.player.maxHitPoints}`);
    }

    calculateExpBar(): void {
        const scale = this.getScale(),
            width = this.expBar.width();

        const experience = this.player.experience - this.player.prevExperience,
            nextExperience = this.player.nextExperience - this.player.prevExperience,
            diff = Math.floor(width * (experience / nextExperience));

        this.exp.css('width', `${diff}px`);
    }

    resize(): void {
        this.calculateHealthBar();
        this.calculateExpBar();
    }

    getScale(): number {
        let scale = this.game.app.getUIScale();

        if (scale < 2) scale = 2;

        return scale;
    }

    toggle(tClass: string): void {
        this.health.addClass(tClass);

        setTimeout(() => {
            this.health.removeClass(tClass);
        }, 500);
    }
}
