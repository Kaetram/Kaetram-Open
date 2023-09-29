import type { Modules, Opcodes } from '../../network';

/**
 * Packet interfaces of data being sent from the client to the server.
 */

export type { HandshakePacket } from '../../network/impl/handshake';

export { TradePacket } from '../../network/impl/trade';

export interface LoginPacket {
    opcode: Opcodes.Login;
    username?: string;
    password?: string;
    email?: string;
}

export interface EquipmentPacket {
    opcode: Opcodes.Equipment;
    type?: Modules.Equipment;
    style?: Modules.AttackStyle;
}

export interface ReadyPacket {
    regionsLoaded: number;
    userAgent: string;
}

export interface MovementPacket {
    opcode: Opcodes.Movement;
    requestX?: number;
    requestY?: number;
    playerX?: number;
    playerY?: number;
    nextGridX?: number;
    nextGridY?: number;
    movementSpeed?: number;
    targetInstance?: string;
    following?: boolean;
    orientation?: Modules.Orientation;
    frozen?: boolean;
    direction?: Modules.Orientation;
    timestamp?: number;
}

export interface ProjectilePacket {
    opcode: Opcodes.Projectile;
    instance: string;
    target: string;
}

export interface ContainerPacket {
    opcode: Opcodes.Container; // The action we're performing.
    type: Modules.ContainerType; // Container the action is taking place in.
    fromContainer: Modules.ContainerType; // Container the item is coming from.
    fromIndex?: number;
    toContainer?: Modules.ContainerType; // Container the item is going to.
    value?: number; // Can be either the count or the index of the item.
}

export interface AbilityPacket {
    opcode: Opcodes.Ability;
    key: string;
    index?: number;
}

export interface EnchantPacket {
    opcode: Opcodes.Enchant;
    index?: number;
    shardIndex?: number;
}

export interface GuildPacket {
    opcode: Opcodes.Guild;
    identifier?: string;
    from?: number;
    to?: number;
    name?: string;
    colour?: Modules.BannerColour;
    outline?: Modules.BannerOutline;
    outlineColour?: Modules.BannerColour;
    crest?: Modules.BannerCrests;
    message?: string;
    username?: string;
}

export interface WarpPacket {
    id: number;
}

export interface StorePacket {
    opcode: Opcodes.Store;
    key: string; // The shop's key.
    index: number; // Index of the item we are working with.
    count: number; // How many of the item we are trying to buy/sell
}

export interface FriendsPacket {
    opcode: Opcodes.Friends;
    username: string;
}

export interface CraftingPacket {
    opcode: Opcodes.Crafting;
    key?: string;
    count?: number;
}

export interface LootBagPacket {
    opcode: Opcodes.LootBag;
    index?: number;
}

export interface PetPacket {
    opcode: Opcodes.Pet;
}
