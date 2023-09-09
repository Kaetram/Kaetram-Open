import healingitem from './healingitem';
import poisoncure from './poisoncure';
import blackpotion from './blackpotion';
import hotsauce from './hotsauce';
import snowpotion from './snowpotion';
import firepotion from './firepotion';
import knife from './knife';
import chisel from './chisel';
import effectpotion from './effectpotion';

import type Player from '@kaetram/server/src/game/entity/character/player/player';

export interface Plugin {
    onUse(player: Player): boolean;
}

export default {
    healingitem,
    poisoncure,
    blackpotion,
    hotsauce,
    snowpotion,
    firepotion,
    knife,
    chisel,
    effectpotion
};
