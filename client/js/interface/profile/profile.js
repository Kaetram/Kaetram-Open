/* global log, _, Packets */

define(['jquery', './pages/state', './pages/ability',
        './pages/settings', './pages/quest', './pages/guild'],
        function($, State, Ability, Settings, Quest, Guild) {

    return Class.extend({

        init: function(game) {
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
        },

        load: function() {
            var self = this;

            self.button.click(function() {
                self.open();
            });

            self.next.click(function() {
                if (self.activeIndex + 1 < self.pages.length)
                    self.setPage(self.activeIndex + 1);
                else
                    self.next.removeClass('enabled');
            });

            self.previous.click(function() {
                if (self.activeIndex > 0)
                    self.setPage(self.activeIndex - 1);
                else
                    self.previous.removeClass('enabled');
            });

            self.state = new State(self.game);
            self.ability = new Ability(self.game);
            self.settings = new Settings(self.game);
            self.quests = new Quest(self.game);
            self.guild = new Guild(self.game);

            self.pages.push(self.state, self.quests, self.guild, self.ability);

            self.activePage = self.state;

            if (self.activeIndex === 0 && self.activeIndex !== self.pages.length)
                self.next.addClass('enabled');
        },

        open: function() {
            var self = this;

            self.game.interface.hideAll();
            self.settings.hide();

            if (self.isVisible()) {
                self.hide();
                self.button.removeClass('active');

            } else {
                self.show();
                self.button.addClass('active');
            }

            if (!self.activePage.loaded)
                self.activePage.load();

            self.game.socket.send(Packets.Click, ['profile', self.button.hasClass('active')]);

        },

        update: function() {
            var self = this;

            _.each(self.pages, function(page) { page.update(); });
        },

        resize: function() {
            var self = this;

            _.each(self.pages, function(page) { page.resize(); });
        },

        setPage: function(index) {
            var self = this,
                page = self.pages[index];

            self.clear();

            if (page.isVisible())
                return;

            self.activePage = page;
            self.activeIndex = index;

            if (self.activeIndex + 1 === self.pages.length)
                self.next.removeClass('enabled');
            else if (self.activeIndex === 0)
                self.previous.removeClass('enabled');
            else {
                self.previous.addClass('enabled');
                self.next.addClass('enabled');
            }

            page.show();
        },

        show: function() {
            var self = this;

            self.body.fadeIn('slow');
            self.button.addClass('active');
        },

        hide: function() {
            var self = this;

            self.body.fadeOut('fast');
            self.button.removeClass('active');

            if (self.settings)
                self.settings.hide();
        },

        clean: function() {
            var self = this;

            self.button.unbind('click');
            self.next.unbind('click');
            self.previous.unbind('click');

            self.quests.clear();
            self.settings.clear();
            self.state.clear();
        },

        isVisible: function() {
            return this.body.css('display') === 'block';
        },

        clear: function() {
            var self = this;

            if (self.activePage)
                self.activePage.hide();
        }

    });

});
