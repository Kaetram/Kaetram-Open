import DefaultContext from './default.context';

import type { Context } from 'mocha';
import type WorldContext from './world.context';

export function getWorldContext<WC extends WorldContext = WorldContext>(world: Context): WC {
    if (!world.worldContext) activateWorldContext(world, new DefaultContext());

    return world.worldContext as WC;
}

export function activateWorldContext<WC extends WorldContext = WorldContext>(
    world: Context,
    context: WC
): void {
    world.worldContext = context;
    cy.visit('/');
    context.injectDefaultData();
    context.before();
}
