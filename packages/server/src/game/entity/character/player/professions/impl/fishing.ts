import Profession from './profession';

import type Player from '../../player';

export default class Fishing extends Profession {
    public constructor(id: number, player: Player) {
        super(id, player, 'Fishing');
    }
}
