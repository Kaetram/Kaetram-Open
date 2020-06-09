class Friends {

	constructor(player) {
		this.player = player;

		this.friends = {};
	}

	update(info) {
		log.info(info);
	}

	add(username) {
		if (username in this.friends) {
			this.player.notify('That player is already in your friends list.');
			return;
		}

		this.friends[username] = 'offline';
	}

	remove(username) {
		delete this.friends[username];
	}

	getArray() {
		return this.friends;
	}

}

export default Friends;
