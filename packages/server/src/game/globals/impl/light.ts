import type { SerializedLight } from '@kaetram/common/network/impl/overlay';

export default class Light {
    /**
     * A light object contains information about the location of the light as well
     * as optional parameters indicating special features such as colour, range, diffuse.
     * @param x The x grid coordinate of the light.
     * @param y The y grid coordinate of the light.
     * @param colour The colour that the light emanates.
     * @param diffuse Light diffuse.
     * @param distance How far the light can reach.
     */

    public constructor(
        public id: number,
        public x: number,
        public y: number,
        public colour = 'rgba(0, 0, 0, 0.2)',
        public diffuse = 0.2,
        public distance = 100,
        public flickerSpeed = 300, // Use -1 to disable flickering.
        public flickerIntensity = 1
    ) {}

    /**
     * Serializes the light object into its JSON representation.
     * @returns A SerializedLight object containing light information.
     */

    public serialize(): SerializedLight {
        return {
            instance: `${this.id}`,
            x: this.x,
            y: this.y,
            colour: this.colour,
            diffuse: this.diffuse,
            distance: this.distance, // Temporarily hardcoded until distance bug is fixed.
            flickerSpeed: this.flickerSpeed,
            flickerIntensity: this.flickerIntensity
        };
    }
}
