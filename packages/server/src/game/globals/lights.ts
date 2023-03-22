import Light from './impl/light';

import log from '@kaetram/common/util/log';

import type Map from '../map/map';

export default class Lights {
    public constructor(private map: Map) {
        for (let light of this.map.lights) {
            // Attempts to identify the region the light is in.
            let region = this.map.regions.get(this.map.regions.getRegion(light.x, light.y));

            // Could not find region.
            if (!region) continue;

            region.addLight(
                new Light(light.id, light.x, light.y, light.colour, light.diffuse, light.distance)
            );
        }

        log.info(`Loaded ${this.map.lights.length} light${this.map.lights.length > 1 ? 's' : ''}.`);
    }
}
