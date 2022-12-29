import { Packets } from '@kaetram/common/network';

import Packet from '../packet';

export default class Music extends Packet {
    public constructor(newSong?: string) {
        super(Packets.Music, undefined, newSong);
    }
}
