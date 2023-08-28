import Quest from '../quest';
import Data from '../../../../../../../data/quests/royalpet.json';

export default class RoyalPet extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
