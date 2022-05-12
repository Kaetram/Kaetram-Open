/**
 * Entity data is referenced by the subclasses whenever
 * extra data needs to be included. Optional variables
 * listed below are used by the subclasses to include
 * additional information to transmit to the client.
 */

export interface EntityData {
    // Entity data
    instance: string;
    type: number;
    key: string;
    name: string;
    x: number;
    y: number;

    // Character data
    movementSpeed?: number;
    hitPoints?: number;
    maxHitPoints?: number;
    attackRange?: number;
    level?: number;
    hiddenName?: boolean;

    // Item data
    count?: number;
    ability?: number;
    abilityLevel?: number;

    // Projectile data
    ownerInstance?: string;
    targetInstance?: string;
    damage?: number;
    hitType?: Modules.Hits;

    // Player data
    // TODO
}
