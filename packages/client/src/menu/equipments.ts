import Menu from './menu';

import Player from '../entity/character/player/player';

export default class Equipments extends Menu {
    public constructor(private player: Player) {
        super('#equipments', '#close-equipments', '#equipment-button');
    }
}
