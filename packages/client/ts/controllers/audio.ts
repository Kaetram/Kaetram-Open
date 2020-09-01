import log from '../lib/log';
import _ from 'lodash';
import * as Detect from '../utils/detect';
import Modules from '../utils/modules';
import Game from '../game';

interface Music {
    beach: boolean;
    beach2: boolean;
    boss: boolean;
    cave: boolean;
    codingroom: boolean;
    desert: boolean;
    forest: boolean;
    lavaland: boolean;
    meadowofthepast: boolean;
    smalltown: boolean;
    spookyship: boolean;
    village: boolean;
}

interface Sounds {
    achievement: boolean;
    chat: boolean;
    chest: boolean;
    death: boolean;
    firefox: boolean;
    heal: boolean;
    hit1: boolean;
    hit2: boolean;
    hurt: boolean;
    kill1: boolean;
    kill2: boolean;
    loot: boolean;
    noloot: boolean;
    npc: boolean;
    'npc-end': boolean;
    npctalk: boolean;
    revive: boolean;
    teleport: boolean;
}

interface AudioElement extends HTMLAudioElement {
    name: Songs;
    fadingIn: NodeJS.Timeout;
    fadingOut: NodeJS.Timeout;
}

type Songs = keyof (Music & Sounds);

type Audibles = {
    [name in Songs]?: AudioElement[];
};

export default class AudioController {
    game: Game;
    audibles: Audibles;
    format: string;
    song: AudioElement;
    songName: string;
    enabled: boolean;
    music: Partial<Music>;
    sounds: Partial<Sounds>;
    newSong: AudioElement;

    constructor(game: Game) {
        this.game = game;

        this.audibles = {};
        this.format = 'mp3';

        this.song = null;
        this.songName = null;

        this.enabled = true;

        this.load();
    }

    load(): void {
        this.music = {
            codingroom: false,
            smalltown: false,
            village: false,
            beach: false,
            spookyship: false,
            meadowofthepast: false
        };

        this.sounds = {
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

    async parse(path: string, name: Songs, channels: number, callback?: () => void): Promise<void> {
        const fullPath = (await import(`../../audio/${path}/${name}.${this.format}`)).default,
            sound = document.createElement('audio') as AudioElement;

        function event() {
            sound.removeEventListener('canplaythrough', event, false);

            callback?.();
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
        sound.setAttribute('autobuffer', 'true');
        sound.src = fullPath;
        sound.name = name;

        sound.load();

        this.audibles[name] = [sound];

        _.times(channels - 1, () => {
            this.audibles[name].push(sound.cloneNode(true) as AudioElement);
        });

        if (name in this.music) this.music[name] = true;
        else if (name in this.sounds) this.sounds[name] = true;
    }

    play(type: number, name: Songs): void {
        if (!this.isEnabled() || !this.fileExists(name) || this.game.player.dead) return;

        if (Detect.isSafari()) return;

        switch (type) {
            case Modules.AudioTypes.Music: {
                this.fadeOut(this.song, () => {
                    this.reset(this.song);
                });

                const song = this.get(name);

                if (!song) return;

                song.volume = 0;

                song.play();

                this.fadeIn(song);

                this.song = song;

                break;
            }

            case Modules.AudioTypes.SFX: {
                if (!this.sounds[name]) this.parse('sounds', name, 4);

                const sound = this.get(name);

                if (!sound) return;

                sound.volume = this.getSFXVolume();

                sound.play();

                break;
            }
        }
    }

    update(): void {
        if (!this.isEnabled()) return;

        if (this.newSong === this.song) return;

        const song = this.getMusic(this.newSong);

        if (song) {
            if (this.game.renderer.mobile) this.reset(this.song);
            else this.fadeSongOut();

            if (song.name in this.music && !this.music[song.name]) {
                this.parse('music', song.name, 1);

                const music = this.audibles[song.name][0];

                music.loop = true;
                music.addEventListener(
                    'ended',
                    () => {
                        music.play();
                    },
                    false
                );
            }

            this.play(Modules.AudioTypes.Music, song.name);
        } else {
            if (this.game.renderer.mobile) this.reset(this.song);
            else this.fadeSongOut();
        }

        this.songName = this.newSong.name;
    }

    fadeIn(song: AudioElement): void {
        if (!song || song.fadingIn) return;

        this.clearFadeOut(song);

        song.fadingIn = setInterval(() => {
            song.volume += 0.02;

            if (song.volume >= this.getMusicVolume() - 0.02) {
                song.volume = this.getMusicVolume();
                this.clearFadeIn(song);
            }
        }, 100);
    }

    fadeOut(song: AudioElement, callback: (song: AudioElement) => void): void {
        if (!song || song.fadingOut) return;

        this.clearFadeIn(song);

        song.fadingOut = setInterval(() => {
            song.volume -= 0.08;

            if (song.volume <= 0.08) {
                song.volume = 0;

                callback?.(song);

                clearInterval(song.fadingOut);
            }
        }, 100);
    }

    fadeSongOut(): void {
        if (!this.song) return;

        this.fadeOut(this.song, (song) => {
            this.reset(song);
        });

        this.song = null;
    }

    clearFadeIn(song: AudioElement): void {
        if (song.fadingIn) {
            clearInterval(song.fadingIn);
            song.fadingIn = null;
        }
    }

    clearFadeOut(song: AudioElement): void {
        if (song.fadingOut) {
            clearInterval(song.fadingOut);
            song.fadingOut = null;
        }
    }

    reset(song: AudioElement): void {
        if (!song || !(song.readyState > 0)) return;

        song.pause();
        song.currentTime = 0;
    }

    stop(): void {
        if (!this.song) return;

        this.fadeOut(this.song, () => {
            this.reset(this.song);
            this.song = null;
        });
    }

    fileExists(name: Songs): boolean {
        return name in this.music || name in this.sounds;
    }

    get(name: Songs): AudioElement {
        if (!this.audibles[name]) return null;

        let audible = _.find(this.audibles[name], (audible) => {
            return audible.ended || audible.paused;
        });

        if (audible && audible.ended) audible.currentTime = 0;
        else audible = this.audibles[name][0];

        return audible;
    }

    getMusic({ name }: AudioElement): { sound: AudioElement; name: Songs } {
        return {
            sound: this.get(name),
            name
        };
    }

    setSongVolume(volume: number): void {
        this.song.volume = volume;
    }

    getSFXVolume(): number {
        return this.game.storage.data.settings.sfx / 100;
    }

    getMusicVolume(): number {
        return this.game.storage.data.settings.music / 100;
    }

    isEnabled(): boolean {
        return this.game.storage.data.settings.soundEnabled && this.enabled;
    }
}
