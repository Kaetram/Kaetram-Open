import log from '../lib/log';
import _ from 'lodash';
import * as Detect from '../utils/detect';
import Modules from '../utils/modules';

export default class AudioController {
    constructor(game) {
        var self = this;

        self.game = game;

        self.audibles = {};
        self.format = 'mp3';

        self.song = null;
        self.songName = null;

        self.enabled = true;

        self.load();
    }

    load() {
        var self = this;

        self.music = {
            codingroom: false,
            smalltown: false,
            village: false,
            beach: false,
            spookyship: false,
            meadowofthepast: false
        };

        self.sounds = {
            loot: false,
            hit1: false,
            hit2: false,
            hurt: false,
            heal: false,
            chat: false,
            revive: false,
            death: false,
            firefox: false,
            achievement: false,
            kill1: false,
            kill2: false,
            noloot: false,
            teleport: false,
            chest: false,
            npc: false,
            'npc-end': false
        };
    }

    parse(path, name, channels, callback) {
        var self = this,
            fullPath = path + name + '.' + self.format,
            sound = document.createElement('audio');

        function event() {
            sound.removeEventListener('canplaythrough', event, false);

            if (callback) callback();
        }
        sound.addEventListener('canplaythrough', event, false);

        sound.addEventListener(
            'error',
            () => {
                log.error(`The audible: ${name} could not be loaded - unsupported extension?`);

                this.audibles[name] = null;
            },
            false
        );

        sound.preload = 'auto';
        sound.autobuffer = true;
        sound.src = fullPath;

        sound.load();

        self.audibles[name] = [sound];

        _.times(channels - 1, function () {
            self.audibles[name].push(sound.cloneNode(true));
        });

        if (name in self.music) self.music[name] = true;
        else if (name in self.sounds) self.sounds[name] = true;
    }

    play(type, name) {
        var self = this;

        if (!self.isEnabled() || !self.fileExists(name) || self.game.player.dead) return;

        if (Detect.isSafari()) return;

        switch (type) {
            case Modules.AudioTypes.Music:
                self.fadeOut(self.song, function () {
                    self.reset(self.song);
                });

                var song = self.get(name);

                if (!song) return;

                song.volume = 0;

                song.play();

                self.fadeIn(song);

                self.song = song;

                break;

            case Modules.AudioTypes.SFX:
                if (!self.sounds[name]) self.parse('audio/sounds/', name, 4);

                var sound = self.get(name);

                if (!sound) return;

                sound.volume = self.getSFXVolume();

                sound.play();

                break;
        }
    }

    update() {
        var self = this;

        if (!self.isEnabled()) return;

        if (self.newSong === self.song) return;

        var song = self.getMusic(self.newSong);

        if (song && !(self.song && self.song.name === song.name)) {
            if (self.game.renderer.mobile) self.reset(self.song);
            else self.fadeSongOut();

            if (song.name in self.music && !self.music[song.name]) {
                self.parse('audio/music/', song.name, 1);

                var music = self.audibles[song.name][0];

                music.loop = true;
                music.addEventListener(
                    'ended',
                    function () {
                        music.play();
                    },
                    false
                );
            }

            self.play(Modules.AudioTypes.Music, song.name);
        } else {
            if (self.game.renderer.mobile) self.reset(self.song);
            else self.fadeSongOut();
        }

        self.songName = self.newSong;
    }

    fadeIn(song) {
        var self = this;

        if (!song || song.fadingIn) return;

        self.clearFadeOut(song);

        song.fadingIn = setInterval(function () {
            song.volume += 0.02;

            if (song.volume >= self.getMusicVolume() - 0.02) {
                song.volume = self.getMusicVolume();
                self.clearFadeIn(song);
            }
        }, 100);
    }

    fadeOut(song, callback) {
        var self = this;

        if (!song || song.fadingOut) return;

        self.clearFadeIn(song);

        song.fadingOut = setInterval(function () {
            song.volume -= 0.08;

            if (song.volume <= 0.08) {
                song.volume = 0;

                if (callback) callback(song);

                clearInterval(song.fadingOut);
            }
        }, 100);
    }

    fadeSongOut() {
        var self = this;

        if (!self.song) return;

        self.fadeOut(self.song, function (song) {
            self.reset(song);
        });

        self.song = null;
    }

    clearFadeIn(song) {
        if (song.fadingIn) {
            clearInterval(song.fadingIn);
            song.fadingIn = null;
        }
    }

    clearFadeOut(song) {
        if (song.fadingOut) {
            clearInterval(song.fadingOut);
            song.fadingOut = null;
        }
    }

    reset(song) {
        if (!song || !song.readyState > 0) return;

        song.pause();
        song.currentTime = 0;
    }

    stop() {
        var self = this;

        if (!self.song) return;

        self.fadeOut(self.song, function () {
            self.reset(self.song);
            self.song = null;
        });
    }

    fileExists(name) {
        return name in this.music || name in this.sounds;
    }

    get(name) {
        var self = this;

        if (!self.audibles[name]) return null;

        var audible = _.find(self.audibles[name], function (audible) {
            return audible.ended || audible.paused;
        });

        if (audible && audible.ended) audible.currentTime = 0;
        else audible = self.audibles[name][0];

        return audible;
    }

    getMusic(name) {
        return {
            sound: this.get(name),
            name: name
        };
    }

    setSongVolume(volume) {
        this.song.volume = volume;
    }

    getSFXVolume() {
        return this.game.storage.data.settings.sfx / 100;
    }

    getMusicVolume() {
        return this.game.storage.data.settings.music / 100;
    }

    isEnabled() {
        return this.game.storage.data.settings.soundEnabled && this.enabled;
    }
}
