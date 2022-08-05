import Packet from '../packet';
import { Packets } from '@kaetram/common/network';
import Entity from '../../game/entity/entity';
import Player from '../../game/entity/character/player/player';
import Mob from '../../game/entity/character/mob/mob';

export default class Spawn extends Packet {
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
                ? (entity as Player).serialize(true)
                : entity.isMob()
                ? (entity as Mob).serialize(player)
                : entity.serialize()
        );
    }
}
