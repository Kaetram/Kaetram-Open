import type { Packets } from '@kaetram/common/network';

export default class Packet {
    public constructor(private id: Packets, private opcode?: number, private data?: unknown) {}

    /**
     * Serializes the packet into an array that is sent to the client.
     * @returns An array containing the packetId, opcode and data.
     */

    public serialize(): unknown {
        return [this.id, this.opcode, this.data];
    }
}
