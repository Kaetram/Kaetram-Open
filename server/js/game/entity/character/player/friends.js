class Friends {

	constructor(player) {
		let self = this;

		self.player = player;

		self.friends = {};
	}

	update(info) {
		log.info(info);
	}

	add(username) {
		let self = this;

		if (username in self.friends) {
			self.player.notify('That player is already in your friends list.');
			return;
		}

		self.friends[username] = 'offline';
	}

	remove(username) {
		delete this.friends[username];
	}

	getArray() {
		return this.friends;
	}

}

module.exports = Friends;
