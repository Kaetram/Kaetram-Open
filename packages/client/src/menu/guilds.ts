import Menu from './menu';

import { Modules, Packets, Opcodes } from '@kaetram/common/network';

import type Game from '../game';
import type { ListInfo } from '@kaetram/common/types/guild';
import type { GuildPacket } from '@kaetram/common/types/messages/outgoing';

export default class Guilds extends Menu {
    // The banner is the banner of the guild that the player is currently in.
    private banner: HTMLElement = document.querySelector('#guilds > .banner')!;

    // The default container and elements for the guilds list, displayed prior to joining a guild.
    private info: HTMLElement = document.querySelector('#guilds-list-container')!;
    private createButton: HTMLButtonElement = document.querySelector('#create-guild')!;

    // Container for creating a new guild.
    private create: HTMLElement = document.querySelector('#guilds-create-container')!;
    private bannerColours: HTMLUListElement = document.querySelector('#banner-colours')!;
    private bannerOutlines: HTMLUListElement = document.querySelector('#banner-outline-colours')!;
    private bannerCrests: HTMLUListElement = document.querySelector('#banner-crests')!;

    // Decorations for the guild interface banner (updated during creation or when guild data is received).
    private bannerColour: Modules.BannerColours = Modules.BannerColours.Grey;
    private bannerOutline: Modules.BannerOutlineColours | '' = '';
    private bannerCrest: Modules.BannerCrests = Modules.BannerCrests.None;

    // List where we store players/guilds list (depending on the context).
    private list: HTMLUListElement = document.querySelector('#guilds-list-container > ul')!;

    // Indexing - default values, used for pagination.
    private from = 0;
    private to = 10;

    public constructor(private game: Game) {
        super('#guilds', '#close-guilds', '#guilds-button');

        this.createButton.addEventListener('click', this.handleCreate.bind(this));

        this.loadDecorations();
    }

    /**
     * Updates the user interface according to the action that was performed.
     * @param opcode The opcode of the action that was performed.
     * @param info Information about the opcode we received.
     */

    public handle(opcode: Opcodes.Guild, info: GuildPacket): void {
        switch (opcode) {
            case Opcodes.Guild.Join: {
                console.log(info);

                break;
            }

            case Opcodes.Guild.Leave: {
                console.log(info);

                break;
            }

            case Opcodes.Guild.Rank: {
                console.log(info);
                break;
            }

            case Opcodes.Guild.Update: {
                console.log(info);
                break;
            }

            case Opcodes.Guild.Experience: {
                console.log(info);

                break;
            }

            case Opcodes.Guild.List: {
                return this.loadList(info.guilds, info.total);
            }
        }
    }

    /**
     * Handler for when the player clicks the create guild button.
     */

    public handleCreate(): void {
        // Hide the default information and show the create guild form.
        this.info.style.display = 'none';

        // Display the create guild form.
        this.create.style.display = 'block';
    }

    /**
     * Loads a list of guilds received from the server.
     * @param guilds Contains information about each guild.
     * @param total The total number of guilds available (used for pagination).
     */

    private loadList(guilds: ListInfo[] = [], total = 0): void {
        // Nothing to do if there are no guilds.
        if (total === 0) return;

        // Remove the description for no guilds available.
        let description = this.info.querySelector('#guilds-info')!;

        description.innerHTML = '';

        console.log(description);
        console.log(guilds);
    }

    /**
     * Programmatically creates the banner decorations for the guild interface. We create
     * each individual element on the page and assign an event listener to each one. We
     * do this to make it easier ot add new decorations in the future.
     */

    private loadDecorations(): void {
        this.loadColours();
        this.loadOutlines();
        this.loadCrests();
    }

    /**
     * Loads the banner colour elements for the create guild interface. We
     * do it programmatically to make it easier to add new colours in the future.
     */

    private loadColours(): void {
        // Iterate through the banner colours and create a list element for each one.
        for (let colour in Modules.BannerColours) {
            let element = document.createElement('li'),
                colourName = Modules.BannerColours[colour as keyof typeof Modules.BannerColours];

            // Add the banner colour classes to the element.
            element.className = `banner-colour-button banner-colour-button-${colourName}`;

            // Event listener to change the selected colour.
            element.addEventListener('click', () => {
                // Update the banner colour.
                this.bannerColour = colourName;

                // Update the banner.
                this.updateBanner();
            });

            // Add the element to the list of banner colours.
            this.bannerColours.append(element);
        }
    }

    /**
     * Loads the banner outline elements for the create guild interface. We
     * do it programmatically to make it easier to add new outlines in the future.
     */

    private loadOutlines(): void {
        // Iterate through the banner outlines and create a list element for each one.
        for (let colour in Modules.BannerOutlineColours) {
            let element = document.createElement('li'),
                outline =
                    Modules.BannerOutlineColours[
                        colour as keyof typeof Modules.BannerOutlineColours
                    ];

            // Add the banner outline classes to the element.
            element.className = `banner-outline-button banner-outline-button-${outline}`;

            // Event listener to change the selected outline.
            element.addEventListener('click', () => {
                // Update the banner outline.
                this.bannerOutline = outline;

                // Update the banner.
                this.updateBanner();
            });

            // Add the element to the list of banner outlines.
            this.bannerOutlines.append(element);
        }
    }

    /**
     * Loads the banner crest elements for the create guild interface. We create
     * the appropriate event listener for each crest and add it to the list.
     */

    private loadCrests(): void {
        // Add the crest elements to the banner.
        for (let crest in Modules.BannerCrests) {
            let element = document.createElement('li'),
                icon = document.createElement('div'),
                crestName = Modules.BannerCrests[crest as keyof typeof Modules.BannerCrests];

            // Add the class to the element.
            element.className = `crest-element`;

            // Add the icon class to the icon element.
            icon.className = `banner-crest-icon banner-crest-icon-${crestName}`;

            // Add the icon to the element.
            element.append(icon);

            // Set the default empty crest icon as active.
            if (crestName === 'none') element.classList.add('active');

            // Event listener to change the selected crest.
            element.addEventListener('click', () => {
                this.cleanSelectedCrests();

                // Update the banner crest.
                this.bannerCrest = crestName;

                // Update the banner.
                this.updateBanner();

                // Set active crest.
                element.classList.add('active');
            });

            // Add the element to the list of crests.
            this.bannerCrests.append(element);
        }
    }

    /**
     * Override for the show function where we send a packet requesting
     * a list of active guilds if the player is not in a guild.
     */

    public override show(): void {
        super.show();

        // No guild so we request a list of active guilds.
        if (!this.game.player.guild)
            return this.game.socket.send(Packets.Guild, {
                opcode: Opcodes.Guild.List,
                from: this.from,
                to: this.to
            });
    }

    /**
     * Override for the hide function where we reset the pagination.
     */

    public override hide(): void {
        super.hide();

        this.from = 0;
        this.to = 10;
    }

    /**
     * Creates an element and appends it to the list. The element depends on the type
     * we are provided. Generally we have two types: guilds and ranks. When creating a rank
     * based element it's generally for players, whereas a guild one is for a list of
     * available guilds.
     * @param type The type of element we are creating.
     * @param name The name to display in the element.
     */

    private createElement(type: Modules.GuildRank | 'guild', name: string, count = 0): void {
        let element = document.createElement('li'),
            nameElement = document.createElement('span');

        // Add the classes to the element
        element.className = `slot-element slot-${type} stroke`;

        // Add the class and inner HTML to the name element.
        nameElement.classList.add('name');
        nameElement.innerHTML = name;

        // Append the name to the element.
        element.append(nameElement);

        // If we have a count and we are creating a guild element element, we do so here.
        if (count > 0 && type === 'guild') {
            let countElement = document.createElement('span');

            // Add the class and inner HTML to the count element.
            countElement.classList.add('count');
            countElement.innerHTML = `${count}`;

            element.append(countElement);
        }

        // Append the element to the list.
        this.list.append(element);
    }

    /**
     * Removes the active class from all the crest selection elements.
     */

    private cleanSelectedCrests(): void {
        for (let crest of this.bannerCrests.children) crest.classList.remove('active');
    }

    /**
     * Updates the banner with the specified colours (in the class).
     */

    private updateBanner(): void {
        let outlineElement = this.banner.querySelector('.banner-outline')!,
            crestElement = this.banner.querySelector('.banner-crest')!;

        // Update the classes with the new colours.
        this.banner.className = `banner banner-${this.bannerColour}`;

        // Update the outline and crest if specified
        if (this.bannerOutline)
            outlineElement.className = `banner-outline banner-outline-${this.bannerOutline}`;

        if (this.bannerCrest)
            crestElement.className = `banner-crest banner-crest-${this.bannerCrest}`;
    }
}
