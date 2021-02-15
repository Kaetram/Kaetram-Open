import $ from 'jquery';
import _ from 'lodash';

import Game from '../../game';
import Packets from '@kaetram/common/src/packets';
import Page from './page';
import Guild from './pages/guild';
import Professions from './pages/professions';
import Quest from './pages/quest';
import Settings from './pages/settings';
import State from './pages/state';

export default class Profile {
    game: Game;
    body: JQuery;
    button: JQuery;
    next: JQuery;
    previous: JQuery;
    activePage: State;
    activeIndex: number;
    pages: Page[];
    state: State;
    professions: Professions;
    settings: Settings;
    quests: Quest;
    guild: Guild;

    constructor(game: Game) {
        this.game = game;

        this.body = $('#profileDialog');
        this.button = $('#profileButton');

        this.next = $('#next');
        this.previous = $('#previous');

        this.activePage = null;
        this.activeIndex = 0;
        this.pages = [];

        this.load();
    }

    load(): void {
        this.button.on('click', () => this.open());

        this.next.on('click', () => {
            if (this.activeIndex + 1 < this.pages.length) this.setPage(this.activeIndex + 1);
            else this.next.removeClass('enabled');
        });

        this.previous.on('click', () => {
            if (this.activeIndex > 0) this.setPage(this.activeIndex - 1);
            else this.previous.removeClass('enabled');
        });

        this.state = new State(this.game);
        this.professions = new Professions(this.game);
        // this.ability = new Ability(this.game);
        this.settings = new Settings(this.game);
        this.quests = new Quest();
        this.guild = new Guild(this.game);

        this.pages.push(this.state, this.professions, this.quests, this.guild);

        this.activePage = this.state;

        if (this.activeIndex === 0 && this.activeIndex !== this.pages.length)
            this.next.addClass('enabled');
    }

    open(): void {
        this.game.menu.hideAll();
        this.settings.hide();

        if (this.isVisible()) {
            this.hide();
            this.button.removeClass('active');
        } else {
            this.show();
            this.button.addClass('active');
        }

        if (!this.activePage.loaded) this.activePage.load();

        this.game.socket.send(Packets.Click, ['profile', this.button.hasClass('active')]);
    }

    update(): void {
        _.each(this.pages as State[], (page) => {
            // if (!page.update) console.log(page);
            page.update?.();
        });
    }

    resize(): void {
        _.each(this.pages as State[], (page) => page?.resize());
    }

    setPage(index: number): void {
        const page = this.pages[index];

        this.clear();

        if (page.isVisible()) return;

        this.activePage = page as State;
        this.activeIndex = index;

        if (this.activeIndex + 1 === this.pages.length) this.next.removeClass('enabled');
        else if (this.activeIndex === 0) this.previous.removeClass('enabled');
        else {
            this.previous.addClass('enabled');
            this.next.addClass('enabled');
        }

        page.show();
    }

    show(): void {
        this.body.fadeIn('slow');
        this.button.addClass('active');
    }

    hide(): void {
        this.body.fadeOut('fast');
        this.button.removeClass('active');

        this.settings?.hide();
    }

    clean(): void {
        this.button.off('click');
        this.next.off('click');
        this.previous.off('click');

        this.quests.clear();
        this.settings.clear();
        // this.state.clear();
    }

    isVisible(): boolean {
        return this.body.css('display') === 'block';
    }

    clear(): void {
        this.activePage?.hide();
    }
}
