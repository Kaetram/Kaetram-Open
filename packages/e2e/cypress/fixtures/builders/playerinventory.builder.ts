import { PlayerInventory } from '@kaetram/e2e/cypress/entities/playerinventory';
import defaultPlayerInventory from '@kaetram/e2e/cypress/fixtures/playerinventory.default.json';

export function buildPlayerInventory(
    username: string,
    overwrites: Partial<PlayerInventory> = {}
): PlayerInventory {
    return {
        ...defaultPlayerInventory,
        ...overwrites,
        username
    };
}
