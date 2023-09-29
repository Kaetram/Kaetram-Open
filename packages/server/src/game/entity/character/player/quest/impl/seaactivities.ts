import Quest from '../quest';
import Data from '../../../../../../../data/quests/seaactivities.json';

export default class SeaActivities extends Quest {
    public constructor(key: string) {
        super(key, Data);
    }
}
