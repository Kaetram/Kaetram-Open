/**
 * Contains cosmetic/appearance data about an entity. These
 * are non-essential packets sent when we want an entity
 * to stand out for some reason (i.e. miniboss has a different scale).
 */

import type { Modules } from '../network';
import type { Enchantments } from './item';

export interface EntityDisplayInfo {
    instance: string;
    colour?: string;
    scale?: number;
}

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

    // Optional paramaeters
    colour?: string; // Name colour
    scale?: number; // Custom scale for the entity

    // Character data
    movementSpeed?: number;
    hitPoints?: number;
    maxHitPoints?: number;
    attackRange?: number;
    level?: number;
    hiddenName?: boolean;
    orientation?: Modules.Orientation;

    // Item data
    count?: number;
    enchantments?: Enchantments;

    // Projectile data
    ownerInstance?: string;
    targetInstance?: string;
    damage?: number;
    hitType?: Modules.Hits;

    displayInfo?: EntityDisplayInfo;
}
