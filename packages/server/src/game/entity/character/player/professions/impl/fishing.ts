import Profession from './profession';

import type Player from '../../player';

export default class Fishing extends Profession {
    tick = 1000;

    constructor(id: number, player: Player) {
        super(id, player, 'Fishing');
    }
}
