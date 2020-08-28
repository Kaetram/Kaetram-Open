import $ from 'jquery';
import _ from 'lodash';
import State from './pages/state';
import Settings from './pages/settings';
import Quest from './pages/quest';
import Guild from './pages/guild';
import Professions from './pages/professions';
import Packets from '../../network/packets';

export default class Profile {
    constructor(game) {
        var self = this;

        self.game = game;

        self.body = $('#profileDialog');
        self.button = $('#profileButton');

        self.next = $('#next');
        self.previous = $('#previous');

        self.activePage = null;
        self.activeIndex = 0;
        self.pages = [];

        self.load();
    }

    load() {
        var self = this;

        self.button.click(function () {
            self.open();
        });

        self.next.click(function () {
            if (self.activeIndex + 1 < self.pages.length) self.setPage(self.activeIndex + 1);
            else self.next.removeClass('enabled');
        });

        self.previous.click(function () {
            if (self.activeIndex > 0) self.setPage(self.activeIndex - 1);
            else self.previous.removeClass('enabled');
        });

        self.state = new State(self.game);
        self.professions = new Professions(self.game);
        //self.ability = new Ability(self.game);
        self.settings = new Settings(self.game);
        self.quests = new Quest(self.game);
        self.guild = new Guild(self.game);

        self.pages.push(self.state, self.professions, self.quests, self.guild);

        self.activePage = self.state;

        if (self.activeIndex === 0 && self.activeIndex !== self.pages.length)
            self.next.addClass('enabled');
    }

    open() {
        var self = this;

        self.game.menu.hideAll();
        self.settings.hide();

        if (self.isVisible()) {
            self.hide();
            self.button.removeClass('active');
        } else {
            self.show();
            self.button.addClass('active');
        }

        if (!self.activePage.loaded) self.activePage.load();

        self.game.socket.send(Packets.Click, ['profile', self.button.hasClass('active')]);
    }

    update() {
        var self = this;

        _.each(self.pages, function (page) {
            page.update();
        });
    }

    resize() {
        var self = this;

        _.each(self.pages, function (page) {
            page.resize();
        });
    }

    setPage(index) {
        var self = this,
            page = self.pages[index];

        self.clear();

        if (page.isVisible()) return;

        self.activePage = page;
        self.activeIndex = index;

        if (self.activeIndex + 1 === self.pages.length) self.next.removeClass('enabled');
        else if (self.activeIndex === 0) self.previous.removeClass('enabled');
        else {
            self.previous.addClass('enabled');
            self.next.addClass('enabled');
        }

        page.show();
    }

    show() {
        var self = this;

        self.body.fadeIn('slow');
        self.button.addClass('active');
    }

    hide() {
        var self = this;

        self.body.fadeOut('fast');
        self.button.removeClass('active');

        if (self.settings) self.settings.hide();
    }

    clean() {
        var self = this;

        self.button.off('click');
        self.next.off('click');
        self.previous.off('click');

        self.quests.clear();
        self.settings.clear();
        self.state.clear();
    }

    isVisible() {
        return this.body.css('display') === 'block';
    }

    clear() {
        var self = this;

        if (self.activePage) self.activePage.hide();
    }
}
