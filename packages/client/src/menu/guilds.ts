import Menu from './menu';

import Util from '../utils/util';

import { Modules, Packets, Opcodes } from '@kaetram/common/network';

import type Game from '../game';
import type { ListInfo, Member } from '@kaetram/common/types/guild';
import type { GuildPacket } from '@kaetram/common/types/messages/outgoing';

interface ListElement extends HTMLElement {
    identifier?: string;
}

export default class Guilds extends Menu {
    // The banner is the banner of the guild that the player is currently in.
    private banner: HTMLElement = document.querySelector('#guilds > .banner')!;

    // The default container and elements for the guilds list, displayed prior to joining a guild.
    private listContainer: HTMLElement = document.querySelector('#guilds-list-container')!;
    private createButton: HTMLButtonElement = document.querySelector('#create-guild')!;

    // Container for creating a new guild.
    private create: HTMLElement = document.querySelector('#guilds-create-container')!;

    private createError: HTMLElement = document.querySelector('#create-error')!;

    private backButton: HTMLElement = document.querySelector('#guild-back')!;
    private createConfirmButton: HTMLButtonElement = document.querySelector('#guild-create')!;

    private bannerColours: HTMLUListElement = document.querySelector('#banner-colours')!;
    private bannerOutlines: HTMLUListElement = document.querySelector('#banner-outline-colours')!;
    private bannerCrests: HTMLUListElement = document.querySelector('#banner-crests')!;

    private nameInput: HTMLInputElement = document.querySelector('#guild-name-input')!;

    // Decorations for the guild interface banner (updated during creation or when guild data is received).
    private bannerColour: Modules.BannerColour = Modules.BannerColour.Grey;
    private bannerOutline: Modules.BannerOutline | '' = '';
    private bannerCrest: Modules.BannerCrests = Modules.BannerCrests.None;

    // The guild information container (if the player is in a guild).
    private infoContainer: HTMLElement = document.querySelector('#guilds-info-container')!;
    private chatLog: HTMLUListElement = document.querySelector('#guild-chat-log')!;
    private chatInput: HTMLInputElement = document.querySelector('#guild-chat-input')!;

    private guildName: HTMLElement = document.querySelector('#guild-name')!;
    private leaveButton: HTMLElement = document.querySelector('#guild-leave')!;

    // List where we store players/guilds list (depending on the context).
    private guildList: HTMLUListElement = document.querySelector('#guilds-list-container > ul')!;
    private memberList: HTMLUListElement = document.querySelector('#member-list')!;
    private sidebarList: HTMLUListElement = document.querySelector('#sidebar-list')!;

    // Indexing - default values, used for pagination.
    private from = 0;
    private to = 10;

    // Sidebar we're currently naivgating.
    private currentSidebar: 'sidebar-members' | 'sidebar-chat' = 'sidebar-members';

    public constructor(private game: Game) {
        super('#guilds', '#close-guilds', '#guilds-button');

        this.createButton.addEventListener('click', this.handleCreate.bind(this));

        this.backButton.addEventListener('click', this.handleBackButton.bind(this));
        this.createConfirmButton.addEventListener('click', this.handleCreateConfirm.bind(this));
        this.leaveButton.addEventListener('click', this.handleLeave.bind(this));

        this.loadSidebar();
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
                return this.handleMemberJoin(info.username!, info.serverId!);
            }

            case Opcodes.Guild.Login: {
                return this.handleConnect(info);
            }

            case Opcodes.Guild.Leave: {
                if (info?.username) return this.handleMemberLeave(info.username);

                return this.handleBackButton();
            }

            case Opcodes.Guild.Rank: {
                console.log(info);
                break;
            }

            case Opcodes.Guild.Update: {
                return this.loadMembers(info.members!);
            }

            case Opcodes.Guild.Experience: {
                console.log(info);

                break;
            }

            case Opcodes.Guild.List: {
                return this.loadList(info.guilds, info.total);
            }

            case Opcodes.Guild.Error: {
                return this.setError(info.message);
            }

            case Opcodes.Guild.Chat: {
                return this.handleChat(info);
            }
        }
    }

    /**
     * Handler for when the player clicks the create guild button.
     */

    private handleCreate(): void {
        // Hide the default information and show the create guild form.
        this.listContainer.style.display = 'none';
        this.infoContainer.style.display = 'none';

        // Display the create guild form.
        this.create.style.display = 'block';
    }

    /**
     * Handler for when the player wants to go back to the guilds list.
     * Basically the opposite of `handleCreate`.
     */

    private handleBackButton(): void {
        // Reset the banner decorations and update it.
        this.bannerColour = Modules.BannerColour.Grey;
        this.bannerOutline = '';
        this.bannerCrest = Modules.BannerCrests.None;

        this.updateBanner();
        this.cleanSelectedCrests(true);

        // Clear all the errors.
        this.setError();

        // Empty the members list.
        this.memberList.innerHTML = '';

        // Empty the chat log.
        this.chatLog.innerHTML = '';

        // Hide other containers and show the default information.
        this.create.style.display = 'none';
        this.infoContainer.style.display = 'none';

        // Display the default information.
        this.listContainer.style.display = 'block';

        // Request the guilds list from the server.
        this.requestList();
    }

    /**
     * Handler for when we click the create confirm button.
     * This will send the packet to the server with the information provided.
     */

    private handleCreateConfirm(): void {
        // Clear the error message.
        this.setError();

        // Verify the values client-sided (server also verifies them).
        if (this.bannerOutline === '') return this.setError('Please select an outline colour.');

        // Ensure the guild name is valid.
        if (this.nameInput.value.length < 3 || this.nameInput.value.length > 16)
            return this.setError('Guild name must be between 3 and 15 characters.');

        // Send the packet to the server with the information.
        this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.Create,
            name: this.nameInput.value,
            colour: this.bannerColour,
            outline: this.bannerOutline,
            crest: this.bannerCrest
        });
    }

    /**
     * Handler for when the player clicks the leave guild button.
     */

    private handleLeave(): void {
        this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.Leave
        });
    }

    /**
     * Handles connection received from the server. We essentially
     * clear all the other interfaces and focus on the guild interface.
     * The player object contains all the guild information necessary.
     * @param info Contains information about the guild, such as decorations.
     */

    private handleConnect(info: GuildPacket): void {
        // Clear the error message.
        this.setError();

        // Hide the default information.
        this.listContainer.style.display = 'none';

        // Hide the create guild form just in case.
        this.create.style.display = 'none';

        // Display the guild information container.
        this.infoContainer.style.display = 'block';

        // Load the guild decorations.
        this.bannerColour = info.decoration?.banner || Modules.BannerColour.Grey;
        this.bannerOutline = info.decoration?.outline || '';
        this.bannerCrest = info.decoration?.crest;

        this.updateBanner();

        // Clear the guild name and members list.
        this.guildName.innerHTML = '';
        this.memberList.innerHTML = '';

        // Update the guild name
        let name = document.createElement('p');

        name.className = 'stroke';

        name.innerHTML = info.name || 'Unknown';

        this.guildName.append(name);

        // Update the leave button to disband if we're the leader.
        if (this.game.player.name.toLowerCase() === info.owner)
            this.leaveButton.innerHTML = 'Disband';

        // Update the guild members list.
        for (let member of info.members!)
            this.createElement(this.memberList, member.rank!, member.username);
    }

    /**
     * Creates a new element based on the username is that joining. Since the player
     * is brand new, then the default rank is the lowest rank. Other inforamtion
     * is not really necessary.
     * @param username The username of the member that joined the guild.
     * @param serverId The server id of the member that joined the guild.
     */

    private handleMemberJoin(username: string, serverId = -1): void {
        // Ignore if we're the one joining.
        if (username === this.game.player.name.toLowerCase()) return;

        this.createElement(this.memberList, Modules.GuildRank.Fledgling, username);

        this.loadMembers([{ username, serverId }]);
    }

    /**
     * Removes a child element from the member list based on the username.
     * @param username The username of the member that left the guild.
     */

    private handleMemberLeave(username: string): void {
        let element = this.getElement(this.memberList, username);

        element?.remove();
    }

    /**
     * Handles clicking on a side bar in a guild interface and updating
     * the interface accordingly.
     * @param menu The string identification of the menu we want to open.
     */

    private handleSidebar(menu: 'sidebar-members' | 'sidebar-chat'): void {
        // Ignore if we don't have a guild.
        if (!this.game.player.guild) return;

        // Ignore if we're already on the menu.
        if (this.currentSidebar === menu) return;

        switch (menu) {
            case 'sidebar-members': {
                this.memberList.style.display = 'block';

                // Remove the active class from the other sidebar.
                this.infoContainer.className = '';

                // Hide the chat input.
                this.chatInput.style.display = 'none';

                // Hide the chat log
                this.chatLog.style.display = 'none';

                break;
            }

            case 'sidebar-chat': {
                // Hide the members list.
                this.memberList.style.display = 'none';

                // Add the chat class to the container.
                this.infoContainer.className = 'guild-chat';

                // Show the chat input.
                this.chatInput.style.display = 'block';

                // Show the chat log.
                this.chatLog.style.display = 'block';

                break;
            }
        }

        // Update the current sidebar.
        this.currentSidebar = menu;
    }

    /**
     * Handles a message received from the server. We add the message
     * to the chat log alongside information about who and from
     * where the message was sent.
     * @param packet Contains information about the message.
     */

    private handleChat(packet: GuildPacket): void {
        // Ignore invalid packets (shouldn't happen).
        if (!packet.username || !packet.serverId) return;

        // Format the source of the message.
        let source = `[W${packet.serverId}] ${Util.formatName(packet.username)}`,
            element = document.createElement('p');

        // Add the message to the chat log.
        element.innerHTML = `${source} » ${packet.message}`;

        this.chatLog.append(element);
    }

    /**
     * Handles the keydown event for the guild interface. Usually when the
     * player is using the chat input, we want to re-route the enter key to
     * send the message to the server.
     * @param key The key that was pressed.
     */

    public keyDown(key: string): void {
        // Ignore if we're not on the chat sidebar.
        if (key !== 'Enter' || this.currentSidebar !== 'sidebar-chat') return;

        // Ignore if the input is empty.
        if (this.chatInput.value.length === 0) return;

        // Send the message to the server.
        this.sendChat();
    }

    /**
     * Requests a list of guilds from the server.
     */

    private requestList(): void {
        if (this.game.player.guild) return;

        return this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.List,
            from: this.from,
            to: this.to
        });
    }

    /**
     * Sends a chat message to the server.
     */

    private sendChat(): void {
        // Ignore if the input is empty.
        if (this.chatInput.value.length === 0) return;

        // Send the message to the server.
        this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.Chat,
            message: this.chatInput.value
        });

        // Clear the input.
        this.chatInput.value = '';
    }

    /**
     * Loads a list of guilds received from the server.
     * @param guilds Contains information about each guild.
     * @param total The total number of guilds available (used for pagination).
     */

    private loadList(guilds: ListInfo[] = [], total = 0): void {
        // Nothing to do if there are no guilds.
        if (total === 0) return;

        // Clear the list of guilds.
        this.guildList.innerHTML = '';

        // Remove the description for no guilds available.
        let description = this.listContainer.querySelector('#guilds-info')!;

        description.innerHTML = '';

        // Iterate through the guilds and create a list element for each one.
        for (let guild of guilds)
            this.createElement(this.guildList, 'guild', guild.name, guild.members);
    }

    /**
     * Creates an event listener and action for each sidebar element.
     */

    private loadSidebar(): void {
        for (let child of this.sidebarList.children)
            child.addEventListener('click', () => {
                // Deselect all the other elements.
                this.cleanSidebar();

                // Select the current element.
                child.classList.add('active');

                // Handle updating the interface.
                this.handleSidebar(child.id as 'sidebar-members' | 'sidebar-chat');
            });
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
        for (let colour in Modules.BannerColour) {
            let element = document.createElement('li'),
                colourName = Modules.BannerColour[colour as keyof typeof Modules.BannerColour];

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
        for (let colour in Modules.BannerOutline) {
            let element = document.createElement('li'),
                outline = Modules.BannerOutline[colour as keyof typeof Modules.BannerOutline];

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
     * Loads a list of members (specifically their online status) for the guild interface.
     * @param members Contains an array of guild members and their online status.
     */

    private loadMembers(members: Member[]): void {
        for (let member of members) {
            let element = this.getElement(this.memberList, member.username);

            if (!element) continue;

            let nameElement = element.querySelector('.name')!,
                serverElement = element.querySelector('.server')!,
                colour =
                    member.serverId === -1
                        ? 'red'
                        : member.serverId === this.game.player.serverId
                        ? 'green'
                        : 'yellow';

            // Update the colour based on the online status.
            nameElement.className = `name`;
            serverElement.className = `server ${colour}`;

            serverElement.innerHTML =
                member.serverId === -1
                    ? 'Offline'
                    : `${this.game.app.config.name} ${member.serverId}`;
        }
    }

    /**
     * Override for the show function where we send a packet requesting
     * a list of active guilds if the player is not in a guild.
     */

    public override show(): void {
        super.show();

        // No guild so we request a list of active guilds.
        this.requestList();
    }

    /**
     * Override for the hide function where we reset the pagination.
     * We also make sure we hide the create interface if the player
     * does not have a guild.
     */

    public override hide(): void {
        super.hide();

        // Reset the pagination.
        this.from = 0;
        this.to = 10;

        // Hide the create interface if the player is not in a guild.
        if (!this.game.player.guild) this.handleBackButton();
    }

    /**
     * Creates an element and appends it to the list. The element depends on the type
     * we are provided. Generally we have two types: guilds and ranks. When creating a rank
     * based element it's generally for players, whereas a guild one is for a list of
     * available guilds.
     * @param list The list to append the element to.
     * @param type The type of element we are creating.
     * @param name The name to display in the element.
     */

    private createElement(
        list: HTMLUListElement,
        type: Modules.GuildRank | 'guild',
        name: string,
        count = 0
    ): void {
        let element = document.createElement('li') as ListElement,
            nameElement = document.createElement('span'),
            isGuild = type === 'guild',
            slotType = type === 'guild' ? 'guild' : Modules.GuildRank[type].toLowerCase();

        // Assign the name as the identifier for the element
        element.identifier = name;

        // Add the classes to the element and name element.
        element.className = `slot-element slot-${slotType} stroke`;
        nameElement.className = `name`;

        // Set the name of the element, format it if it's a player name.
        nameElement.innerHTML = isGuild ? name : Util.formatName(name, 14);

        // Conditional for dealing with guild element creation.
        if (isGuild) {
            if (count > 0) {
                let countElement = document.createElement('span');

                // Add the class and inner HTML to the count element.
                countElement.classList.add('count');
                countElement.innerHTML = `${count}/${Modules.Constants.MAX_GUILD_MEMBERS}`;

                element.append(countElement);
            }

            // Create the join button for the guild.
            let joinButton = document.createElement('div');

            // Add the class to the join button.
            joinButton.className = 'element-button stroke';

            // Add the inner HTML to the join button.
            joinButton.innerHTML = 'Join';

            // Add the event listener to the join button.
            joinButton.addEventListener('click', () => {
                this.game.socket.send(Packets.Guild, {
                    opcode: Opcodes.Guild.Join,
                    identifier: name.toLowerCase()
                });
            });

            // Append name and join elements.
            element.append(nameElement, joinButton);
        }

        // Append just the name element.
        if (!isGuild) {
            element.append(nameElement);

            let serverElement = document.createElement('span'),
                isPlayer = this.game.player.name.toLowerCase() === element.identifier;

            serverElement.className = `server ${isPlayer ? 'green' : 'red'}`;

            serverElement.innerHTML = isPlayer ? 'Online' : 'Offline';

            element.append(serverElement);
        }

        // Append the element to the list.
        list.append(element);
    }

    /**
     * Removes the active class from all the crest selection elements.
     */

    private cleanSelectedCrests(selectEmpty = false): void {
        for (let crest of this.bannerCrests.children) crest.classList.remove('active');

        // Select the empty crest if specified.
        if (selectEmpty) this.bannerCrests.children[0].classList.add('active');
    }

    /**
     * Deselects all the sidebar elements by removing the active class.
     */

    private cleanSidebar(): void {
        for (let element of this.sidebarList.children) element.classList.remove('active');
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
        outlineElement.className = `banner-outline${
            this.bannerOutline ? ` banner-outline-${this.bannerOutline}` : ''
        }`;

        if (this.bannerCrest)
            crestElement.className = `banner-crest banner-crest-${this.bannerCrest}`;
    }

    /**
     * Grabs a list element from the list based on the identifier.
     * @param list The list we are searching through.
     * @param identifier The identifier we are searching for.
     * @returns A list element if found otherwise undefined.
     */

    private getElement(list: HTMLUListElement, identifier: string): ListElement | undefined {
        for (let element of list.children)
            if ((element as ListElement).identifier === identifier) return element as ListElement;

        return undefined;
    }

    /**
     * Updates the create error element with a message.
     * @param text The message to display.
     */

    private setError(text = ''): void {
        this.createError.innerHTML = text;
    }
}
