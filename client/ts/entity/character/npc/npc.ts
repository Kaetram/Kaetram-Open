import Character from '../character';

export default class NPC extends Character {
    constructor(id, kind) {
        super(id, kind);

        this.type = 'npc';
    }
}
