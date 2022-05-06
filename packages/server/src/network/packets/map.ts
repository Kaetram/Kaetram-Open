import Packet from '../packet';
import { Opcodes, Packets } from '@kaetram/common/network';
import Utils from '@kaetram/common/util/utils';

export default class Map extends Packet {
    public constructor(opcode: Opcodes.Map, data: unknown) {
        super(Packets.Map, opcode, Utils.compress(JSON.stringify(data)), Utils.getBufferSize(data));
    }
}
