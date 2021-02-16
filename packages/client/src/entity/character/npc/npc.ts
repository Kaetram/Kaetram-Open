import Character from '../character';

export default class NPC extends Character {
    constructor(id: string, kind: string) {
        super(id, kind);

        this.type = 'npc';
    }
}
