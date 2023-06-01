export interface SerializedLight {
    instance: string;
    x: number;
    y: number;
    colour: string;
    diffuse: number;
    distance: number;
    flickerSpeed: number;
    flickerIntensity: number;

    centre?: boolean;
}
