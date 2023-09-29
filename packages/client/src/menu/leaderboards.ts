import Menu from './menu';

import log from '../lib/log';

import { Modules } from '@kaetram/common/network';

import type App from '../app';

interface SearchElement {
    name: string;
    key: string | number;
    type: 'skill' | 'mob' | 'pvp' | '';
}

interface ResultInfo {
    _id: string;
    experience?: number;
    kills?: number;
    cheater?: boolean;
}

export default class Leaderboards extends Menu {
    public override identifier: number = Modules.Interfaces.Leaderboards;

    // Where we show all the possible leaderboards
    private searchList: HTMLUListElement = document.querySelector('#leaderboards-search > ul')!;

    // Where we display the results from the selected list
    private resultsList: HTMLUListElement = document.querySelector('#leaderboards-results > ul')!;

    // The search input
    private search: HTMLInputElement = document.querySelector('#leaderboards-search-input')!;

    // Search elements available (key is the search URL term, value is the name displayed).
    private searchElements: SearchElement[] = [
        { name: 'Total Experience', key: '', type: '' },
        { name: 'PVP Kills', key: 'pvp', type: 'pvp' }
    ];
    private availableMobs: { [key: string]: string } = {};

    public constructor(private app: App) {
        super('#leaderboards', '#close-leaderboards', '#leaderboards-button');

        this.search.addEventListener('input', this.handleInput.bind(this));

        // Append all the skills to the search elements
        for (let index of Modules.SkillsOrder)
            this.searchElements.push({ name: Modules.Skills[index], key: index, type: 'skill' });

        // Hub is not enabled, stop here.
        if (!this.app.config.hub) return;

        // Fetch the available mobs from the hub
        fetch(`${this.app.config.hub}/leaderboards`)
            .then((response: Response) => response.json())
            .then((data) => {
                if (data.availableMobs) {
                    // Save the available mobs.
                    this.availableMobs = data.availableMobs;

                    // Append the name of the mobs to the search elements.
                    for (let mob in this.availableMobs)
                        this.searchElements.push({
                            name: this.availableMobs[mob],
                            key: mob,
                            type: 'mob'
                        });

                    this.load();
                }
            })
            .catch((error: Error) => {
                log.error(error);
            });
    }

    /**
     * Loads the available search elements into an individual object. The object
     * is then appended to the search list.
     */

    private load(): void {
        // Clear the search list
        this.searchList.innerHTML = '';

        // Create a search element for each search element.
        for (let element of this.searchElements) this.createSearchElement(element);

        // Select the first element in the list.
        this.handleSearchElement(this.searchElements[0]);
    }

    /**
     * Handler for when the player has inputted something in the search bar. We iterate
     * through all the elements and if they do not match the inputted text, we hide them.
     * @param event Contains information about the input event.
     */

    private handleInput(event: Event): void {
        let input = (event.target as HTMLInputElement).value.toLowerCase();

        for (let element of this.searchList.children) {
            let name = element.querySelector('p')!.innerHTML.toLowerCase();

            // Hide the element if it doesn't match the input or unhide it if it does.
            if (name.includes(input)) (element as HTMLElement).hidden = false;
            else (element as HTMLElement).hidden = true;
        }
    }

    /**
     * Handles the action of clicking on a search element. We create an API call to the
     * hub then we update the search list with the results.
     * @param searchElement The search element that the player has clicked on.
     */

    private handleSearchElement(searchElement: SearchElement): void {
        let url = `${this.app.config.hub}/leaderboards`;

        // If we have a search type then we append that onto the URL.
        if (searchElement.type) url += `?${searchElement.type}=${searchElement.key}`;

        // Fetch the results from the hub.
        fetch(url)
            .then((response: Response) => response.json())
            .then((data) => {
                if (!data.list) return log.info('No results found.');

                // Clear the results list.
                this.resultsList.innerHTML = '';

                // Create a result element for each result.
                for (let result of data.list)
                    this.createResultElement(result as ResultInfo, searchElement.type);
            })
            .catch((error: Error) => {
                log.error(error);
            });
    }

    /**
     * Override for the show function to scroll all the elements back to the top
     * when we display the leaderboards interface.
     */

    public override show(): void {
        super.show();

        this.searchList.scrollTop = 0;
        this.resultsList.scrollTop = 0;
    }

    /**
     * Override for the hide function where we also clear the input field.
     */

    public override hide(): void {
        super.hide();

        // Clear the input field
        this.search.value = '';
    }

    /**
     * Handler for when the player enters a key while the leaderboards menu is
     * open. We want to prevent keys from activating other menus.
     * @param key The key that the player is pressing.
     */

    public keyDown(key: string): void {
        // Ignore any other keys aside from escape.
        if (key !== 'Escape') return;

        this.hide();
    }

    /**
     * Creates an element in the search menu with the specified name.
     * @param searchElement Contains information about the element we are creating, we're
     * also using it to bind the click event.
     */

    private createSearchElement(searchElement: SearchElement): void {
        let element = document.createElement('li'),
            name = document.createElement('p');

        // Add the slot class to the element.
        element.classList.add('slice-list-item');

        // Add styling to the friend name element.
        name.classList.add('stroke', 'white');

        // Set the name of the element.
        name.innerHTML = searchElement.name;

        // Add the name element to the element.
        element.append(name);

        // Bind the click event to the element.
        element.addEventListener('click', () => this.handleSearchElement(searchElement));

        this.searchList.append(element);
    }

    /**
     * Creates a result element in the list of results. The result relates to a player
     * and the description to how much of exp/mob kills they have.
     * @param result Contains the information of the result element we are creating.
     * @param type The type of result we are creating (skill or kills) so we can extract necessary info.
     */

    private createResultElement(result: ResultInfo, type: string): void {
        let element = document.createElement('li'),
            name = document.createElement('p'),
            info = document.createElement('p');

        // Add the slot class to the element.
        element.classList.add('slice-list-item');

        // Bind the username to the left of the container
        if (result.cheater) name.classList.add('text-red');

        // Bind the description to the right of the container
        if (result.cheater) info.classList.add('text-red');

        // Set the name of the element.
        name.innerHTML = result._id;

        // Set the description of the element.
        info.innerHTML =
            type === 'skill' || type === '' ? `${result.experience}` : `${result.kills}`;

        // Add the name element to the element.
        element.append(name, info);

        // Append the element to the results list.
        this.resultsList.append(element);
    }
}
