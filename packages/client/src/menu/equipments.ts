import Menu from './menu';

import Player from '../entity/character/player/player';

export default class Equipments extends Menu {
    public constructor(private player: Player) {
        super('#equipments', '#close-equipments', '#equipment-info-button');
    }

    /**
     * Override for the `show()` function to avoid closing other
     * menus when the equipments interface is displayed.
     */

    public override show(): void {
        this.container.style.display = 'block';
        this.button?.classList.add('active');
    }
}
