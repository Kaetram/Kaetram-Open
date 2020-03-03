import Combat from '../../ts/game/entity/character/combat/combat';
import Hit from '../../ts/game/entity/character/combat/hit';
import Utils from '../../ts/util/utils';
import Modules from '../../ts/util/modules';

class Snek extends Combat {
  public character: any;

  constructor(character) {
    character.spawnDistance = 15;
    super(character);

    this.character = character;

    this.character.onDamage((target, hitInfo) => {
      if (!target || target.type !== 'player') return;

      if (this.canPoison()) target.setPoison(this.getPoisonData());

      console.info(
        `Entity ${this.character.id} hit ${target.instance} - damage ${hitInfo.damage}.`
      );
    });
  }

  canPoison() {
    const chance = Utils.randomInt(0, this.character.level);

    return chance === 7;
  }

  getPoisonData() {
    return new Date().getTime().toString() + ':30000:1';
  }
}

export default Snek;
