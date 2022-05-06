import Packet from '../packet';
import { Packets } from '@kaetram/common/network';

export default class Audio extends Packet {
    public constructor(data: string) {
        super(Packets.Audio, undefined, data);
    }
}
