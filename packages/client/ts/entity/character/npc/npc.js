import Character from '../character';

export default class NCP extends Character {
    constructor(id, kind) {
        super(id, kind);

        this.type = 'npc';
    }
}
