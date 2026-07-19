import assert from 'node:assert/strict';
import test from 'node:test';

import { shuffleInPlace } from '../src/game/minigames/minigame';

test('lobby shuffle uses the inclusive Fisher-Yates upper bound', () => {
    let bounds: [number, number][] = [],
        players = ['a', 'b', 'c'];

    shuffleInPlace(players, (minimum, maximum) => {
        bounds.push([minimum, maximum]);
        return maximum;
    });

    assert.deepEqual(bounds, [
        [0, 2],
        [0, 1]
    ]);
    assert.deepEqual(players, ['a', 'b', 'c']);
});
