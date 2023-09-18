import Menu from './menu';

import Util from '../utils/util';

import { Modules, Packets, Opcodes } from '@kaetram/common/network';

import type Game from '../game';
import type { ListInfo, Member } from '@kaetram/common/network/impl/guild';
import type { GuildPacketData } from '@kaetram/common/types/messages/outgoing';

export default class Guilds extends Menu {
    public override identifier: number = Modules.Interfaces.Guilds;

    // The banner is the banner of the guild that the player is currently in.
    private banner: HTMLElement = document.querySelector('#guilds .banner')!;

    // The default container and elements for the guilds list, displayed prior to joining a guild.
    private listContainer: HTMLElement = document.querySelector('#guilds-list-container')!;
    private createButton: HTMLButtonElement = document.querySelector('#create-guild')!;

    // Container for creating a new guild.
    private create: HTMLElement = document.querySelector('#guilds-create')!;
    private createError: HTMLElement = document.querySelector('#guilds-create-error')!;

    private backButton: HTMLElement = document.querySelector('#guilds-back-button')!;
    private createConfirmButton: HTMLButtonElement =
        document.querySelector('#guilds-create-button')!;

    // The colour buttons for the banner (used when creating a guild).
    private bannerColours: HTMLUListElement = document.querySelector('#banner-colours')!;

    private nameInput: HTMLInputElement = document.querySelector('#guilds-name-input')!;

    // Decorations for the guild interface banner (updated during creation or when guild data is received).
    private bannerColour: Modules.BannerColour = Modules.BannerColour.Grey;
    private bannerOutline: Modules.BannerOutline = Modules.BannerOutline.StyleOne;
    private bannerOutlineColour: Modules.BannerColour = Modules.BannerColour.GoldenYellow;
    private bannerCrest: Modules.BannerCrests | undefined = Modules.BannerCrests.None;

    // Buttons used for selecting which banner colours we're modifying (outline or banner).
    private bannerColourButton: HTMLElement = document.querySelector('#banner-colour-button')!;
    private bannerOutlineButton: HTMLElement = document.querySelector('#banner-outline-button')!;

    private bannerOutlineRight: HTMLElement = this.bannerOutlineButton.querySelector(
        '.colour-button-arrow-left'
    )!;
    private bannerOutlineLeft: HTMLElement = this.bannerOutlineButton.querySelector(
        '.colour-button-arrow-right'
    )!;

    // The guild information container (if the player is in a guild).
    private infoContainer: HTMLElement = document.querySelector('#guilds-info-container')!;
    private chat: HTMLUListElement = document.querySelector('#guilds-chat')!;
    private chatLog: HTMLUListElement = document.querySelector('#guilds-chat-log')!;
    private chatInput: HTMLInputElement = document.querySelector('#guilds-chat-input')!;

    private guildName: HTMLElement = document.querySelector('#guilds-name')!;
    private leaveButton: HTMLElement = document.querySelector('#guilds-leave')!;

    // List where we store players/guilds list (depending on the context).
    private guildList: HTMLUListElement = document.querySelector('#guilds-list > ul')!;
    private memberListContainer: HTMLElement = document.querySelector('#member-list-container')!;
    private memberList: HTMLUListElement = this.memberListContainer.querySelector('ul')!;
    private sidebarList: HTMLUListElement = document.querySelector('#sidebar-list')!;

    private selectedMember?: string;
    private memberName: HTMLElement = document.querySelector('#guild-member-selected')!;
    private memberDialog: HTMLElement = document.querySelector('#guild-member-dialog')!;
    private memberPromote: HTMLElement = document.querySelector('#guild-member-promote')!;
    private memberDemote: HTMLElement = document.querySelector('#guild-member-demote')!;
    private memberKick: HTMLElement = document.querySelector('#guild-member-kick')!;

    // Indexing - default values, used for pagination.
    private from = 0;
    private to = 10;

    // Sidebar we're currently naivgating.
    private currentSidebar: 'sidebar-members' | 'sidebar-chat' = 'sidebar-members';

    // Used by the create menu to determine which element we're working with.
    private colourSelection: 'banner' | 'outline' = 'banner';

    // Used to cycle through banner styles
    private bannerOutlineStyles: string[] = [];

    public constructor(private game: Game) {
        super('#guilds', '#close-guilds', '#guilds-button');

        this.createButton.addEventListener('click', this.handleCreate.bind(this));

        this.backButton.addEventListener('click', this.handleBackButton.bind(this));
        this.createConfirmButton.addEventListener('click', this.handleCreateConfirm.bind(this));
        this.leaveButton.addEventListener('click', this.handleLeave.bind(this));

        this.bannerColourButton.addEventListener('click', () =>
            this.handleColourSelection('banner')
        );
        this.bannerOutlineButton.addEventListener('click', () =>
            this.handleColourSelection('outline')
        );

        this.bannerOutlineRight.addEventListener('click', () =>
            this.handleBannerOutlineStyle('right')
        );
        this.bannerOutlineLeft.addEventListener('click', () =>
            this.handleBannerOutlineStyle('left')
        );

        this.memberPromote.addEventListener('click', this.handlePromote.bind(this));
        this.memberDemote.addEventListener('click', this.handleDemote.bind(this));
        this.memberKick.addEventListener('click', this.handleKick.bind(this));

        this.loadSidebar();
        this.loadDecorations();

        // Request a list update every 10 seconds.
        setInterval(() => this.requestList(), 12_000);
    }

    /**
     * Updates the user interface according to the action that was performed.
     * @param opcode The opcode of the action that was performed.
     * @param info Information about the opcode we received.
     */

    public handle(opcode: Opcodes.Guild, info: GuildPacketData): void {
        switch (opcode) {
            case Opcodes.Guild.Join: {
                return this.handleMemberJoin(info.username!, info.serverId!);
            }

            case Opcodes.Guild.Login: {
                return this.handleConnect(info);
            }

            case Opcodes.Guild.Leave: {
                if (info?.username && info.username !== this.getUsername()) {
                    this.game.player.removeGuildMember(info.username!);

                    return this.handleMemberLeave(info.username);
                }

                this.game.player.setGuild();

                return this.handleBackButton();
            }

            case Opcodes.Guild.Rank: {
                return this.setRank(info.username!, info.rank!);
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
        this.create.style.display = 'flex';
    }

    /**
     * Handler for when the player wants to go back to the guilds list.
     * Basically the opposite of `handleCreate`.
     */

    private handleBackButton(): void {
        // Reset the banner decorations and update it.
        this.bannerColour = Modules.BannerColour.Grey;
        this.bannerOutline = Modules.BannerOutline.StyleOne;
        this.bannerOutlineColour = Modules.BannerColour.GoldenYellow;
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
        this.listContainer.style.display = 'flex';

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

        // Ensure the guild name is valid.
        if (this.nameInput.value.length < 3 || this.nameInput.value.length > 16)
            return this.setError('Guild name must be between 3 and 15 characters.');

        // Send the packet to the server with the information.
        this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.Create,
            name: this.nameInput.value,
            colour: this.bannerColour,
            outline: this.bannerOutline,
            outlineColour: this.bannerOutlineColour,
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
     * Handler for when the player clicks the promote button.
     */

    private handlePromote(): void {
        this.memberListContainer.querySelector('ul')!.classList.remove('dimmed');
        this.memberDialog.style.display = 'none';

        this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.Promote,
            username: this.selectedMember
        });
    }

    /**
     * Handler for when the player clicks the demote button.
     */

    private handleDemote(): void {
        this.memberListContainer.querySelector('ul')!.classList.remove('dimmed');
        this.memberDialog.style.display = 'none';

        this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.Demote,
            username: this.selectedMember
        });
    }

    /**
     * Handler for when the player clicks the kick button.
     */

    private handleKick(): void {
        this.memberListContainer.querySelector('ul')!.classList.remove('dimmed');
        this.memberDialog.style.display = 'none';

        this.game.socket.send(Packets.Guild, {
            opcode: Opcodes.Guild.Kick,
            username: this.selectedMember
        });
    }

    /**
     * Handles connection received from the server. We essentially
     * clear all the other interfaces and focus on the guild interface.
     * The player object contains all the guild information necessary.
     * @param info Contains information about the guild, such as decorations.
     */

    private handleConnect(info: GuildPacketData): void {
        // Clear the error message.
        this.setError();

        // Hide the default information.
        this.listContainer.style.display = 'none';

        // Hide the create guild form just in case.
        this.create.style.display = 'none';

        // Display the guild information container.
        this.infoContainer.style.display = 'flex';

        // Load the guild decorations.
        this.bannerColour = info.decoration?.banner || Modules.BannerColour.Grey;
        this.bannerOutline = info.decoration?.outline || Modules.BannerOutline.StyleOne;
        this.bannerOutlineColour =
            info.decoration?.outlineColour || Modules.BannerColour.GoldenYellow;
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
        if (this.getUsername() === info.owner) this.leaveButton.innerHTML = 'Disband';

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
        if (username === this.getUsername()) return;

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
                this.memberListContainer.style.display = 'flex';

                // Hide the chat.
                this.chat.style.display = 'none';

                break;
            }

            case 'sidebar-chat': {
                // Hide the members list.
                this.memberListContainer.style.display = 'none';

                // Show the chat input.
                this.chat.style.display = 'flex';

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

    private handleChat(packet: GuildPacketData): void {
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
     * Handles toggling between selecting the banner colour or the banner's outline
     * colour. We update the buttons here and update the colour selection variable.
     * @param type The type of colour the player wants to modify (banner or outline).
     */

    private handleColourSelection(type: 'banner' | 'outline'): void {
        this.colourSelection = type;

        // Remove the active class from both buttons.
        this.bannerColourButton.classList.remove('active');
        this.bannerOutlineButton.classList.remove('active');

        // Add the active class to the button that was clicked.
        if (type === 'banner') this.bannerColourButton.classList.add('active');
        else this.bannerOutlineButton.classList.add('active');
    }

    /**
     * Handles toggling between the banner styles using the left and right buttons. These
     * just circle through the same styles over and over again.
     * @param direction The direction we want to cycle through the styles.
     */

    private handleBannerOutlineStyle(direction: 'right' | 'left'): void {
        this.bannerOutline =
            direction === 'right' ? this.bannerOutline + 1 : this.bannerOutline - 1;

        // Make sure the style selection is within the bounds of the array.
        if ((this.bannerOutline as number) < 0)
            this.bannerOutline = this.bannerOutlineStyles.length - 1;
        else if ((this.bannerOutline as number) >= this.bannerOutlineStyles.length)
            this.bannerOutline = 0;

        // Update the banner outline selection button thingy.
        this.bannerOutlineButton.className = `colour-select-button outline-button-${
            this.bannerOutline + 1
        } active`;

        // Update the banner outline style.
        this.updateBanner();
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
        if (this.game.player.guild || !this.isVisible()) return;

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
        // Clear the list of guilds.
        this.guildList.innerHTML = '';

        // Remove the description for no guilds available.
        let description = this.listContainer.querySelector('#guilds-info')!;

        // Description is empty if there are any guilds.
        description.innerHTML = total === 0 ? 'There are no guilds available...' : '';

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
                outline = document.createElement('div'),
                colourName = Modules.BannerColour[colour as keyof typeof Modules.BannerColour];

            // Add the banner colour classes to the element.
            element.className = `banner-colour-button banner-colour-button-${colourName}`;

            // Prepare the outline element
            outline.className = `banner-colour-button-outline`;

            // Event listener to change the selected colour.
            element.addEventListener('click', () => {
                // Modify colour based on the selection of banner we have.
                if (this.colourSelection === 'banner') this.bannerColour = colourName;
                else this.bannerOutlineColour = colourName;

                // Update the banner.
                this.updateBanner();
            });

            // Append the outline to the element.
            element.append(outline);

            // Add the element to the list of banner colours.
            this.bannerColours.append(element);
        }
    }

    /**
     * Loads the outline styles so that we can cycle through them when the
     * player clicks the left and right buttons for the banner outline style.
     */

    private loadOutlines(): void {
        // Iterate through the styles and create the class element for each, store it in an array.
        for (let style in Modules.BannerOutline) {
            let index = parseInt(style);

            if (isNaN(index)) continue;

            // The class elements that we're going to add to the banner.
            this.bannerOutlineStyles.push(`banner-outline-${index + 1}`);
        }
    }

    /**
     * Loads the banner crest elements for the create guild interface. We create
     * the appropriate event listener for each crest and add it to the list.
     */

    private loadCrests(): void {
        // Add the crest elements to the banner.
        // for (let crest in Modules.BannerCrests) {
        //     let element = document.createElement('li'),
        //         icon = document.createElement('div'),
        //         crestName = Modules.BannerCrests[crest as keyof typeof Modules.BannerCrests];
        //     // Add the class to the element.
        //     element.className = `crest-element`;
        //     // Add the icon class to the icon element.
        //     icon.className = `banner-crest-icon banner-crest-icon-${crestName}`;
        //     // Add the icon to the element.
        //     element.append(icon);
        //     // Set the default empty crest icon as active.
        //     if (crestName === 'none') element.classList.add('active');
        //     // Event listener to change the selected crest.
        //     element.addEventListener('click', () => {
        //         this.cleanSelectedCrests();
        //         // Update the banner crest.
        //         this.bannerCrest = crestName;
        //         // Update the banner.
        //         this.updateBanner();
        //         // Set active crest.
        //         element.classList.add('active');
        //     });
        //     // Add the element to the list of crests.
        //     this.bannerCrests.append(element);
        // }
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
                        ? 'text-red'
                        : member.serverId === this.game.player.serverId
                        ? 'text-green'
                        : 'text-yellow';

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
     * Updates the rank of a member in the guild interface.
     * @param username The username of the member to update.
     * @param rank The new rank of the member.
     */

    private setRank(username: string, rank: Modules.GuildRank): void {
        let element = this.getElement(this.memberList, username);

        if (!element) return;

        let image = element.querySelector('.slot-image');

        if (!image) return;

        // Update the class name with the new rank information.
        image.className = `slot-image slot-image-${Modules.GuildRank[rank].toLowerCase()}`;
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
        let element = document.createElement('li'),
            nameElement = document.createElement('span'),
            imageElement = document.createElement('div'),
            isGuild = type === 'guild',
            slotType = type === 'guild' ? 'guild' : Modules.GuildRank[type].toLowerCase();

        // Assign the name as the identifier for the element
        element.dataset.name = name;

        // Add the classes to the element, name element, and image element.
        element.className = 'slot-element stroke';
        nameElement.className = 'name';
        imageElement.className = 'slot-image';

        // Set the name of the element, format it if it's a player name.
        nameElement.innerHTML = isGuild ? name : Util.formatName(name, 14);

        // Add the image element first.
        element.append(imageElement);

        // Conditional for dealing with guild element creation.
        if (isGuild) {
            if (count > 0) {
                let countElement = document.createElement('span');

                // Add the class and inner HTML to the count element.
                countElement.classList.add('count');
                countElement.innerHTML = `${count}/${Modules.Constants.MAX_GUILD_MEMBERS}`;

                element.append(nameElement, countElement);
            }

            // Event listener to handle the guild selection.
            element.addEventListener('click', () =>
                this.game.socket.send(Packets.Guild, {
                    opcode: Opcodes.Guild.Join,
                    identifier: name.toLowerCase()
                })
            );
        } // Case for when we are dealing with members within a guild.
        else {
            // Handle the image element for when we are in a guild.
            imageElement.classList.add(`slot-image-${slotType}`);

            element.append(nameElement);

            let serverElement = document.createElement('span'),
                isPlayer = this.getUsername() === element.dataset.name,
                playerMember = this.game.player.getGuildMember(this.getUsername()),
                otherMember = this.game.player.getGuildMember(name),
                lowerRank = (otherMember?.rank || 0) > (playerMember?.rank || 0);

            serverElement.className = `server ${isPlayer ? 'text-green' : 'text-red'}`;

            serverElement.innerHTML = isPlayer ? `Kaetram ${this.game.player.serverId}` : 'Offline';

            element.append(serverElement);

            if (!isPlayer && !lowerRank)
                element.addEventListener('click', () => {
                    this.selectedMember = element.dataset.name;
                    this.memberName.textContent = Util.formatName(this.selectedMember, 14);

                    this.memberListContainer.querySelector('ul')!.classList.add('dimmed');

                    this.memberDialog.style.display = 'flex';
                });
        }

        // Append the element to the list.
        list.append(element);
    }

    /**
     * Removes the active class from all the crest selection elements.
     */

    private cleanSelectedCrests(selectEmpty = false): void {
        // for (let crest of this.bannerCrests.children) crest.classList.remove('active');
        // // Select the empty crest if specified.
        // if (selectEmpty) this.bannerCrests.children[0].classList.add('active');
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
        let outlineElement = this.banner.querySelector('#banner-outline')!,
            crestElement = this.banner.querySelector('#banner-crest')!;

        // Update the classes with the new colours.
        this.banner.className = `banner banner-${this.bannerColour}`;

        // Update the outline and crest if specified
        outlineElement.className = `${
            this.bannerOutlineStyles[this.bannerOutline]
        } banner-outline-${this.bannerOutlineColour}`;

        if (this.bannerCrest)
            crestElement.className = `banner-crest banner-crest-${this.bannerCrest}`;
    }

    /**
     * Grabs a list element from the list based on the identifier.
     * @param list The list we are searching through.
     * @param identifier The identifier we are searching for.
     * @returns A list element if found otherwise undefined.
     */

    private getElement(list: HTMLUListElement, identifier: string): HTMLLIElement | undefined {
        for (let element of list.children)
            if ((element as HTMLLIElement).dataset.name === identifier)
                return element as HTMLLIElement;

        return undefined;
    }

    /**
     * Shortcut function that returns the username of the player that is
     * currently logged into the game. This is to just avoid typing out
     * `this.game.player.name.toLowerCase()` every time.
     * @returns The username of the player to lower case.
     */

    private getUsername(): string {
        return this.game.player.name.toLowerCase();
    }

    /**
     * Updates the create error element with a message.
     * @param text The message to display.
     */

    private setError(text = ''): void {
        this.createError.innerHTML = Util.parseMessage(Util.formatNotification(text));
    }
}
