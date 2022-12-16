import type { Packets } from '@kaetram/common/network';

/**
 * The skeleton file for each packet. We separate packets
 * into separate files for readability purposes. Each packet
 * gets serialized, added to the queue in packets, then
 * when the connection sends the packet, it is stringified.
 */

export default class Packet {
    public constructor(
        public id: Packets,
        public opcode?: number,
        public data?: unknown,
        private bufferSize?: number
    ) {}

    /**
     * Serializes a packet and transforms it into an array that is sent
     * to the client. An opcode is included only if it exists.
     * @returns An array containing the packetId, opcode (if present),
     * data, and bufferSize (which may or may not exist).
     */

    public serialize(): unknown {
        return this.opcode === undefined
            ? [this.id, this.data, this.bufferSize]
            : [this.id, this.opcode, this.data, this.bufferSize];
    }
}
