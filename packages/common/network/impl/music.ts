import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

export type MusicPacketCallback = (newSong?: string) => void;

export default class MusicPacket extends Packet {
    public constructor(newSong?: string) {
        super(Packets.Music, undefined, newSong);
    }
}
