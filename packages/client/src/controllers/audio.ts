import _ from 'lodash';

import * as Modules from '@kaetram/common/src/modules';

import log from '../lib/log';
import { isSafari } from '../utils/detect';

import type Game from '../game';

type Music =
    | 'beach'
    | 'beach2'
    | 'boss'
    | 'cave'
    | 'codingroom'
    | 'desert'
    | 'forest'
    | 'lavaland'
    | 'meadowofthepast'
    | 'smalltown'
    | 'spookyship'
    | 'village';

type Sounds =
    | 'achievement'
    | 'chat'
    | 'chest'
    | 'death'
    | 'firefox'
    | 'heal'
    | 'hit1'
    | 'hit2'
    | 'hurt'
    | 'kill1'
    | 'kill2'
    | 'loot'
    | 'noloot'
    | 'npc'
    | 'npc-end'
    | 'npctalk'
    | 'revive'
    | 'teleport';

type Audio = Music | Sounds;

interface AudioElement extends HTMLAudioElement {
    name: Audio;
    fadingIn: number | null;
    fadingOut: number | null;

    cloneNode(deep?: boolean): AudioElement;
}

type Audibles = { [name in Audio]?: AudioElement[] | null };

export default class AudioController {
    private audibles: Audibles = {};
    private readonly format = 'mp3';

    public song!: AudioElement | null;

    private music: { [name in Music]?: boolean } = {};
    private sounds: { [name in Sounds]?: boolean } = {};

    public newSong!: AudioElement;

    public constructor(private game: Game) {}

    public async parse(path: 'music' | 'sounds', name: Audio, channels: number): Promise<void> {
        const { format, audibles, music, sounds } = this;

        const { default: fullPath } = await import(`../../audio/${path}/${name}.${format}`);

        const sound = document.createElement('audio') as AudioElement;

        const event = (): void => sound.removeEventListener('canplaythrough', event, false);

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

        if (name in music) music[name as Music] = true;
        else if (name in sounds) sounds[name as Sounds] = true;
    }

    public async play(type: Modules.AudioTypes, name: Audio): Promise<void> {
        const { game, sounds } = this;

        if (!this.isEnabled() || game.player.dead) return;

        if (isSafari()) return; // ?

        switch (type) {
            case Modules.AudioTypes.Music: {
                this.fadeOut(this.song, () => this.reset(this.song));

                const song = this.get(name);

                if (!song) return;

                song.volume = 0;

                song.play();

                this.fadeIn(song);

                this.song = song;

                break;
            }

            case Modules.AudioTypes.SFX: {
                if (!sounds[name as Sounds]) await this.parse('sounds', name, 4);

                const sound = this.get(name);

                if (!sound) return;

                sound.volume = this.getSFXVolume()!;

                sound.play();

                break;
            }
        }
    }

    public async update(): Promise<void> {
        if (!this.isEnabled()) return;

        const { newSong, game, music, audibles } = this;

        if (!newSong || newSong === this.song) return;

        const song = this.getMusic(newSong);

        if (song) {
            if (game.renderer.mobile) this.reset(this.song);
            else this.fadeSongOut();

            if (song.name in music && !music[song.name as Music]) {
                await this.parse('music', song.name, 1);

                const [music] = audibles[song.name]!;

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

            const musicVolume = this.getMusicVolume()!;

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

    private get(name: Audio): AudioElement | undefined {
        const { audibles } = this;

        if (!audibles[name]) return;

        let audible = _.find(audibles[name], ({ ended, paused }) => ended || paused);

        if (audible?.ended) audible.currentTime = 0;
        else audible = audibles[name]?.[0];

        return audible;
    }

    private getMusic({ name }: AudioElement): { name: Audio; sound: AudioElement | undefined } {
        return {
            name,
            sound: this.get(name)
        };
    }

    private getSFXVolume(): number | null {
        const { storage } = this.game;

        return storage ? storage.data.settings.sfx / 100 : null;
    }

    private getMusicVolume(): number | null {
        const { storage } = this.game;

        return storage ? storage.data.settings.music / 100 : null;
    }

    private isEnabled(): boolean | undefined {
        return this.game.storage.data.settings.soundEnabled;
    }
}
