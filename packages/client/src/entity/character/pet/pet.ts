import Character from '../character';

import { Modules } from '@kaetram/common/network';

import type Game from '../../../game';

export default class Pet extends Character {
    public constructor(instance: string, public owner: string, game: Game) {
        super(instance, Modules.EntityType.Pet, game);
    }
}
