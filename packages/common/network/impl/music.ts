import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export default class Music extends Packet {
    public constructor(newSong?: string) {
        super(Packets.Music, undefined, newSong);
    }
}
