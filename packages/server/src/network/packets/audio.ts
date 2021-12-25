import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';

export default class Camera extends Packet {
    public constructor(data: string) {
        super(Packets.Audio, undefined, data);
    }
}
