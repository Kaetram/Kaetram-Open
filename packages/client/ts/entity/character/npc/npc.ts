import Character from '../character';

export default class NCP extends Character {
    constructor(id: string, kind: number) {
        super(id, kind);

        this.type = 'npc';
    }
}
