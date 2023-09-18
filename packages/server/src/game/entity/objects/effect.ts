import Entity from '../entity';
import rawData from '../../../../data/effectentities.json';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';
import log from '@kaetram/common/util/log';

interface EffectEntityData {
    duration?: number;
}

interface RawData {
    [key: string]: EffectEntityData;
}

export default class Effect extends Entity {
    private data: EffectEntityData;

    private duration = 4000;

    private despawnCallback?: () => void;

    public constructor(key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.Effect), key, x, y);

        this.data = (rawData as RawData)[key];

        if (!this.data) {
            log.error(`[NPC] Could not find data for ${key}.`);
            return;
        }

        this.duration = this.data.duration ?? this.duration;

        setTimeout(() => this.despawnCallback?.(), this.duration);
    }

    /**
     * Callback for when the entity has lived long enough and needs to be despawned.
     */

    public onDespawn(callback: () => void): void {
        this.despawnCallback = callback;
    }
}
