import Handler from './handler';

import Character from '../character';

import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type Player from '../player/player';

export default class Pet extends Character {
    private handler: Handler;

    public constructor(public owner: Player, key: string, x: number, y: number) {
        super(Utils.createInstance(Modules.EntityType.Pet), owner.world, key, x, y);

        this.handler = new Handler(this);
    }
}
