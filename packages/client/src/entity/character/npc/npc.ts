import Character from '../character';

export default class NCP extends Character {
    constructor(id: string, type: string) {
        super(id, type);

        this.type = 'npc';
    }
}
