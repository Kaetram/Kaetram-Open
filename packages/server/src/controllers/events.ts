import Utils from '@kaetram/common/util/utils';
import { Modules } from '@kaetram/common/network';

import type World from '../game/world';

/**
 * Events are special events that occur during the weekends. These may include 1.5x experience,
 * double the drop rates, amongst other things.
 */

export default class Events {
    public activeEvent = '';

    private events = ['double drops', '1.5x experience', 'lumberjacking', 'mining'];

    // Store constants of the altered values.
    public doubleDropProbability = Modules.Constants.DROP_PROBABILITY / 2;
    public experiencePerHit = Modules.Constants.EXPERIENCE_PER_HIT * 1.5;

    public constructor(private world: World) {
        this.check();

        // Check the activity of the event every hour.
        setInterval(this.check.bind(this), Modules.Constants.EVENTS_CHECK_INTERVAL);
    }

    /**
     * Checks whether or not whether the current day of the week is a weekend.
     * If it is, and if an event is not active, then we will activate it and signal
     * to all the players that it is active.
     */

    private check(): void {
        let isWeekend = new Date().getDay() % 6 === 0;

        // Skip if it is weekend.
        if (!isWeekend) return this.disable();

        // An event is active so we stop here.
        if (this.activeEvent) return;

        // Pick an event based on the remainder of the week number.
        this.activeEvent = this.events[this.getWeekNumber() % this.events.length];

        // Broadcast the event to all the players.
        this.world.globalMessage('WORLD', `The ${this.activeEvent} event has started.`);

        // Enable the double harvesting.
        if (this.activeEvent === 'lumberjacking') Utils.doubleLumberjacking = true;
        if (this.activeEvent === 'mining') Utils.doubleMining = true;
    }

    /**
     * Disables all the events.
     */

    private disable(): void {
        if (this.activeEvent)
            this.world.globalMessage('WORLD', `The ${this.activeEvent} event has ended.`);

        this.activeEvent = '';

        // Disable the double harvesting.
        Utils.doubleLumberjacking = false;
        Utils.doubleMining = false;
    }

    /**
     * Grabs the current week number, we use this to determine which
     * event to activate based on a remainder of the week number.
     * @returns The week number.
     */

    private getWeekNumber(): number {
        let current = new Date(),
            yearStart = new Date(current.getFullYear(), 0, 1),
            days = Math.floor((current.getTime() - yearStart.getTime()) / 86_400_000);

        return Math.ceil((current.getDay() + days + 1) / 7);
    }

    /**
     * @returns Whether or not the currently active event is double experience.
     */

    public isDoubleDrop(): boolean {
        return this.activeEvent === 'double drops';
    }

    /**
     * @returns Whether or not the currently active event is double experience.
     */

    public isIncreasedExperience(): boolean {
        return this.activeEvent === '1.5x experience';
    }
}
