import _ from 'lodash-es';

import { Modules } from '@kaetram/common/network';

import log from '../lib/log';

import Util from '../utils/util';
import { isSafari } from '../utils/detect';

import type Game from '../game';

interface AudioElement extends HTMLAudioElement {
    name: string;
    fadingIn: number | null;
    fadingOut: number | null;

    cloneNode(deep?: boolean): AudioElement;
}

type Audibles = { [key: string]: AudioElement[] | null };

export default class AudioController {
    private audibles: Audibles = {};
    private readonly format = 'mp3';

    public song!: AudioElement | null;
    public newSong = '';

    private music: { [key: string]: boolean } = {};
    private sounds: { [key: string]: boolean } = {};

    public constructor(private game: Game) {}

    public parse(path: 'music' | 'sounds', name: string, channels: number): void {
        let { format, audibles, music, sounds } = this,
            fullPath = `/audio/${path}/${name}.${format}`,
            sound = document.createElement('audio') as AudioElement,
            event = (): void => sound.removeEventListener('canplaythrough', event, false);

        sound.addEventListener('canplaythrough', event, false);

        sound.addEventListener(
            'error',
            () => {
                log.error(`The audible: ${name} could not be loaded - unsupported extension?`);

                audibles[name] = null;
            },
            false
        );

        sound.preload = 'auto';
        sound.setAttribute('autobuffer', 'true');
        sound.src = fullPath;
        sound.name = name;

        sound.load();

        audibles[name] = [sound];

        _.times(channels - 1, () => audibles[name]?.push(sound.cloneNode(true)));

        if (name in music) music[name] = true;
        else if (name in sounds) sounds[name] = true;
    }

    public play(type: Modules.AudioTypes, name: string): void {
        let { game, sounds, music } = this;

        if (!this.isEnabled() || game.player.dead) return;

        if (isSafari()) return; // ?

        switch (type) {
            case Modules.AudioTypes.Music: {
                this.fadeOut(this.song, () => this.reset(this.song));

                if (!music[name]) this.parse('music', name, 1);

                let song = this.get(name);

                if (!song) return;

                song.volume = 0;

                song.play();

                this.fadeIn(song);

                this.song = song;

                break;
            }

            case Modules.AudioTypes.SFX: {
                if (!sounds[name]) this.parse('sounds', name, 4);

                let sound = this.get(name);

                if (!sound) return;

                sound.volume = this.getSFXVolume()!;

                sound.play();

                break;
            }
        }
    }

    /**
     * Picks between the two possible hit sound effects
     * and plays one of them randomly.
     */

    public playHit(): void {
        this.play(Modules.AudioTypes.SFX, `hit${Util.randomInt(1, 2)}`);
    }

    /**
     * Plays one of the kill sound effects randomly.
     */

    public playKill(): void {
        this.play(Modules.AudioTypes.SFX, `kill${Util.randomInt(1, 2)}`);
    }

    public playHurt(): void {
        this.play(Modules.AudioTypes.SFX, 'hurt');
    }

    public update(): void {
        if (!this.isEnabled() || !this.newSong) return this.stop();

        let { newSong, game, music, audibles } = this;

        if (!newSong || newSong === this.song?.name) return;

        let song = this.getMusic(newSong);

        if (song) {
            if (game.renderer.mobile) this.reset(this.song);
            else this.fadeSongOut();

            if (song.name in music && !music[song.name]) {
                this.parse('music', song.name, 1);

                let [music] = audibles[song.name]!;

                music.loop = true;
                music.addEventListener('ended', () => music.play(), false);
            }

            this.play(Modules.AudioTypes.Music, song.name);
        } else if (game.renderer.mobile) this.reset(this.song);
        else this.fadeSongOut();
    }

    private fadeIn(song: AudioElement): void {
        if (!song || song.fadingIn) return;

        this.clearFadeOut(song);

        song.fadingIn = window.setInterval(() => {
            song.volume += 0.02;

            let musicVolume = this.getMusicVolume()!;

            if (song.volume >= musicVolume - 0.02) {
                song.volume = musicVolume;

                this.clearFadeIn(song);
            }
        }, 100);
    }

    private fadeOut(song: AudioElement | null, callback?: (song: AudioElement) => void): void {
        if (!song || song.fadingOut) return;

        this.clearFadeIn(song);

        song.fadingOut = window.setInterval(() => {
            song.volume -= 0.08;

            if (song.volume <= 0.08) {
                song.volume = 0;

                callback?.(song);

                clearInterval(song.fadingOut!);
            }
        }, 100);
    }

    private fadeSongOut(): void {
        if (!this.song) return;

        this.fadeOut(this.song, (song) => this.reset(song));

        this.song = null;
    }

    private clearFadeIn(song: AudioElement): void {
        if (song.fadingIn) {
            clearInterval(song.fadingIn);
            song.fadingIn = null;
        }
    }

    private clearFadeOut(song: AudioElement): void {
        if (song.fadingOut) {
            clearInterval(song.fadingOut);
            song.fadingOut = null;
        }
    }

    public reset(song: AudioElement | null): void {
        if (!song || !(song.readyState > 0)) return;

        song.pause();
        song.currentTime = 0;
    }

    public stop(): void {
        if (!this.song) return;

        this.fadeOut(this.song, () => {
            this.reset(this.song);
            this.song = null;
        });
    }

    private isEnabled(): boolean {
        return this.game.storage.data.settings.soundEnabled;
    }

    private get(name: string): AudioElement | undefined {
        let { audibles } = this;

        if (!audibles[name]) return;

        let audible = _.find(audibles[name], ({ ended, paused }) => ended || paused);

        if (audible?.ended) audible.currentTime = 0;
        else audible = audibles[name]?.[0];

        return audible;
    }

    private getMusic(name: string): { name: string; sound: AudioElement | undefined } {
        return {
            name,
            sound: this.get(name)
        };
    }

    private getSFXVolume(): number | null {
        let { storage } = this.game;

        return storage ? storage.data.settings.sfx / 100 : null;
    }

    private getMusicVolume(): number | null {
        let { storage } = this.game;

        return storage ? storage.data.settings.music / 100 : null;
    }
}
