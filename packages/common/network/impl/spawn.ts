import Packet from '../packet';

import { Packets } from '@kaetram/common/network';

import type { EntityData } from '@kaetram/common/types/entity';
import type Entity from '@kaetram/server/src/game/entity/entity';
import type Player from '@kaetram/server/src/game/entity/character/player/player';

export type SpawnPacketCallback = (data: EntityData) => void;

export default class SpawnPacket extends Packet {
    /**
     * The spawn packet for entity is a little bit more complex. We include an optional
     * player parameter that we can use to obtain special display data upon spawning the entity.
     * @param entity The entity we are serializing and sending to the client.
     * @param player Optional parameter that can be used to serialize display info into the entity.
     */

    public constructor(entity: Entity, player?: Player) {
        // Serialize differently for player and mobs.
        super(
            Packets.Spawn,
            undefined,
            entity.isPlayer()
                ? entity.serialize(true)
                : entity.isMob()
                ? entity.serialize(player)
                : entity.serialize()
        );
    }
}
