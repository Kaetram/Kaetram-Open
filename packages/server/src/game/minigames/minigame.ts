import Area from '../map/areas/area';

export default class Minigame {
    public constructor(public key: string) {}

    /**
     * Superclass function that is called when an area is loaded into the minigame. Once
     * the server finishes initializing, it looks through all the minigame areas and
     * loads them depending on their key.
     * @param area Area object used for the minigame.
     */

    public loadArea(area: Area): void {
        //
    }
}
