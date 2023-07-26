export interface DefinePacket<const T, const U extends keyof T = keyof T> {
    Data: T;
    Values: T[U];
    Outgoing: { [O in U]: { opcode: O } & T[O] }[U];
    Callback<const O extends U>(opcode: O, info: T[O]): void;
}
