import WorldContext from './world.context';
import DefaultContext from './default.context';

export function getWorldContext<WC extends WorldContext = WorldContext>(world: any): WC {
    if (!world.worldContext) activateWorldContext(world, new DefaultContext());

    return world.worldContext as WC;
}

export function activateWorldContext<WC extends WorldContext = WorldContext>(
    world: any,
    context: WC
): void {
    world.worldContext = context;
    cy.visit('/');
    context.injectDefaultData();
}
