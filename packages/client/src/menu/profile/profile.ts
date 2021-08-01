import $ from 'jquery';
import _ from 'lodash';

import { Packets } from '@kaetram/common/network';

import Guild from './pages/guild';
import Professions from './pages/professions';
import Quest from './pages/quest';
import Settings from './pages/settings';
import State from './pages/state';

import type Game from '../../game';
import type Page from './page';

export default class Profile {
    private body = $('#profileDialog');
    private button = $('#profileButton');

    private next = $('#next');
    private previous = $('#previous');

    private activePage!: State;
    private activeIndex = 0;
    private pages: Page[] = [];

    private state!: State;
    public professions!: Professions;
    public settings!: Settings;
    public quests!: Quest;
    private guild!: Guild;

    public constructor(private game: Game) {
        this.load();
    }

    private load(): void {
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
        this.professions = new Professions();
        // this.ability = new Ability();
        this.settings = new Settings(this.game);
        this.quests = new Quest();
        this.guild = new Guild();

        this.pages.push(this.state, this.professions, this.quests, this.guild);

        this.activePage = this.state;

        if (this.activeIndex === 0 && this.activeIndex !== this.pages.length)
            this.next.addClass('enabled');
    }

    public open(): void {
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

    public update(): void {
        _.each(this.pages as State[], (page) => {
            // if (!page.update) console.log(page);
            page.update?.();
        });
    }

    public resize(): void {
        _.each(this.pages as State[], (page) => page?.resize());
    }

    public setPage(index: number): void {
        let page = this.pages[index];

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

    private show(): void {
        this.body.fadeIn('slow');
        this.button.addClass('active');
    }

    public hide(): void {
        this.body.fadeOut('fast');
        this.button.removeClass('active');

        this.settings?.hide();
    }

    public clean(): void {
        this.button.off('click');
        this.next.off('click');
        this.previous.off('click');

        this.quests.clear();
        this.settings.clear();
        // this.state.clear();
    }

    public isVisible(): boolean {
        return this.body.css('display') === 'block';
    }

    private clear(): void {
        this.activePage?.hide();
    }
}
