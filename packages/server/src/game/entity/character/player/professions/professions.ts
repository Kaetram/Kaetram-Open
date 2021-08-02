import _ from 'lodash';

import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

import professions from './impl';

import type { ProfessionsInfo } from '@kaetram/common/types/info';
import type Player from '../player';
import type Profession from './impl/profession';

export interface ProfessionsData {
    [id: number]: {
        experience: number;
    };
}

export interface ProfessionsArray {
    username: string;
    data: ProfessionsData;
}

export default class Professions {
    world;

    professions: { [id: number]: Profession } = {};

    public constructor(private player: Player) {
        this.world = player.world;

        this.load();
    }

    load(): void {
        let pList = Object.keys(Modules.Professions) as (keyof typeof professions)[]; // professions enum list

        /**
         * We are accessing all the professions in the Modules.Professions
         * enum. We use the key to generate the profession class instance.
         */

        _.each(pList, (profession) => {
            try {
                let ProfessionClass = professions[profession],
                    id = Modules.Professions[profession];

                if (ProfessionClass) this.professions[id] = new ProfessionClass(id, this.player);
            } catch (error) {
                log.debug(`Could not load ${profession} profession.`);
                log.error(error);
            }
        });
    }

    update(info: ProfessionsData): void {
        _.each(info, (data, id) => {
            if (!(id in this.professions)) return;

            this.professions[id as unknown as number].load(data);
        });
    }

    getProfession<P extends Profession>(id: number): P | null {
        if (!(id in this.professions)) return null;

        return this.professions[id] as P;
    }

    stopAll(): void {
        this.forEachProfession((profession: Profession) => {
            profession.stop();
        });
    }

    forEachProfession(callback: (profession: Profession) => void): void {
        _.each(this.professions, (profession) => {
            callback(profession);
        });
    }

    /**
     * This is the data we send to the client in order
     * to load the professions profile tab.
     */
    getInfo(): ProfessionsInfo[] {
        let data: ProfessionsInfo[] = [];

        _.each(this.professions, (profession: Profession) => {
            data.push({
                id: profession.id,
                name: profession.name,
                level: profession.level,
                percentage: profession.getPercentage()
            });
        });

        return data;
    }

    getArray(): ProfessionsArray {
        let data: ProfessionsData = {};

        _.each(this.professions, (profession: Profession) => {
            data[profession.id] = profession.getData();
        });

        return {
            username: this.player.username,
            data
        };
    }
}
