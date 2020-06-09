(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[1],{

/***/ "./game/entity/character/player/professions/impl/lumberjacking.ts":
/*!************************************************************************!*\
  !*** ./game/entity/character/player/professions/impl/lumberjacking.ts ***!
  \************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _profession__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./profession */ "./game/entity/character/player/professions/impl/profession.ts");
/* harmony import */ var _network_messages__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../../../network/messages */ "./network/messages.ts");
/* harmony import */ var _util_modules__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../../util/modules */ "./util/modules.ts");
/* harmony import */ var _util_formulas__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../../../util/formulas */ "./util/formulas.ts");
/* harmony import */ var _util_utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../../../../util/utils */ "./util/utils.ts");
/* harmony import */ var _data_professions_trees__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../../../../../data/professions/trees */ "../data/professions/trees.ts");







class Lumberjacking extends _profession__WEBPACK_IMPORTED_MODULE_0__["default"] {
  constructor(id, player) {
    super(id, player, 'Lumberjacking');
    this.tick = 1000;
    this.cuttingInterval = null;
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.cuttingInterval = setInterval(() => {
      try {
        if (!this.player || !this.isTarget() || this.world.isTreeCut(this.targetId)) {
          this.stop();
          return;
        }

        if (!this.treeId || !this.targetId) return;

        if (!this.player.inventory.canHold(_data_professions_trees__WEBPACK_IMPORTED_MODULE_5__["default"].Logs[this.treeId], 1)) {
          this.player.notify('You do not have enough space in your inventory!');
          this.stop();
          return;
        }

        this.sync();
        this.player.sendToRegion(new _network_messages__WEBPACK_IMPORTED_MODULE_1__["default"].Animation(this.player.instance, {
          action: _util_modules__WEBPACK_IMPORTED_MODULE_2__["default"].Actions.Attack
        }));
        var probability = _util_formulas__WEBPACK_IMPORTED_MODULE_3__["default"].getTreeChance(this.player, this.treeId);

        if (_util_utils__WEBPACK_IMPORTED_MODULE_4__["default"].randomInt(0, probability) === 2) {
          this.addExperience(_data_professions_trees__WEBPACK_IMPORTED_MODULE_5__["default"].Experience[this.treeId]);
          this.player.inventory.add({
            id: _data_professions_trees__WEBPACK_IMPORTED_MODULE_5__["default"].Logs[this.treeId],
            count: 1
          });
          if (this.getTreeDestroyChance()) this.world.destroyTree(this.targetId, _util_modules__WEBPACK_IMPORTED_MODULE_2__["default"].Trees[this.treeId]);
        }
      } catch (e) {}
    }, this.tick);
    this.started = true;
  }

  stop() {
    if (!this.started) return;
    this.treeId = null;
    this.targetId = null;
    clearInterval(this.cuttingInterval);
    this.cuttingInterval = null;
    this.started = false;
  }

  handle(id, treeId) {
    if (!this.player.hasLumberjackingWeapon()) {
      this.player.notify('You do not have an axe to cut this tree with.');
      return;
    }

    this.treeId = treeId;
    this.targetId = id;
    this.world.destroyTree(this.targetId, _util_modules__WEBPACK_IMPORTED_MODULE_2__["default"].Trees[this.treeId]);

    if (this.level < _data_professions_trees__WEBPACK_IMPORTED_MODULE_5__["default"].Levels[this.treeId]) {
      this.player.notify("You must be at least level ".concat(_data_professions_trees__WEBPACK_IMPORTED_MODULE_5__["default"].Levels[this.treeId], " to cut this tree!"));
      return;
    } //this.start();

  }

  getTreeDestroyChance() {
    return _util_utils__WEBPACK_IMPORTED_MODULE_4__["default"].randomInt(0, _data_professions_trees__WEBPACK_IMPORTED_MODULE_5__["default"].Chances[this.treeId]) === 2;
  }

  getQueueCount() {
    return Object.keys(this.queuedTrees).length;
  }

}

/* harmony default export */ __webpack_exports__["default"] = (Lumberjacking);

/***/ }),

/***/ "./game/entity/character/player/professions/impl/profession.ts":
/*!*********************************************************************!*\
  !*** ./game/entity/character/player/professions/impl/profession.ts ***!
  \*********************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _util_modules__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../../../util/modules */ "./util/modules.ts");
/* harmony import */ var _util_formulas__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../../../util/formulas */ "./util/formulas.ts");
/* harmony import */ var _util_constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../../util/constants */ "./util/constants.ts");
/* harmony import */ var _network_messages__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../../../network/messages */ "./network/messages.ts");
/* harmony import */ var _network_packets__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../../../../network/packets */ "./network/packets.ts");






class Profession {
  constructor(id, player, name) {
    this.id = id;
    this.player = player;
    this.name = name; // The profession name

    this.world = player.world;
    this.map = this.world.map;
    this.region = this.world.region;
    this.experience = 0;
    this.targetId = null;
  }

  load(data) {
    this.experience = data.experience;
    this.level = _util_formulas__WEBPACK_IMPORTED_MODULE_1__["default"].expToLevel(this.experience);
    this.nextExperience = _util_formulas__WEBPACK_IMPORTED_MODULE_1__["default"].nextExp(this.experience);
    this.prevExperience = _util_formulas__WEBPACK_IMPORTED_MODULE_1__["default"].prevExp(this.experience);
  }

  addExperience(experience) {
    this.experience += experience;
    var oldLevel = this.level;
    this.level = _util_formulas__WEBPACK_IMPORTED_MODULE_1__["default"].expToLevel(this.experience);
    this.nextExperience = _util_formulas__WEBPACK_IMPORTED_MODULE_1__["default"].nextExp(this.experience);
    this.prevExperience = _util_formulas__WEBPACK_IMPORTED_MODULE_1__["default"].prevExp(this.experience);
    if (oldLevel !== this.level) this.player.popup('Profession Level Up!', "Congratulations, your ".concat(this.name, " level is now ").concat(this.level, "."), '#9933ff');
    this.player.send(new _network_messages__WEBPACK_IMPORTED_MODULE_3__["default"].Experience(_network_packets__WEBPACK_IMPORTED_MODULE_4__["default"].ExperienceOpcode.Profession, {
      id: this.player.instance,
      amount: experience
    }));
    this.player.send(new _network_messages__WEBPACK_IMPORTED_MODULE_3__["default"].Profession(_network_packets__WEBPACK_IMPORTED_MODULE_4__["default"].ProfessionOpcode.Update, {
      id: this.id,
      level: this.level,
      percentage: this.getPercentage()
    }));
    this.player.save();
  }

  stop() {
    return 'Not implemented.';
  }

  getLevel() {
    var level = _util_formulas__WEBPACK_IMPORTED_MODULE_1__["default"].expToLevel(this.experience);
    if (level > _util_constants__WEBPACK_IMPORTED_MODULE_2__["default"].MAX_PROFESSION_LEVEL) level = _util_constants__WEBPACK_IMPORTED_MODULE_2__["default"].MAX_PROFESSION_LEVEL;
    return level;
  }

  sync() {
    this.player.sendToAdjacentRegions(this.player.region, new _network_messages__WEBPACK_IMPORTED_MODULE_3__["default"].Sync({
      id: this.player.instance,
      orientation: this.getOrientation()
    }));
  }

  isTarget() {
    return this.player.target === this.targetId;
  }

  getPercentage() {
    var experience = this.experience - this.prevExperience,
        nextExperience = this.nextExperience - this.prevExperience;
    return (experience / nextExperience * 100).toFixed(2);
  }

  getOrientation() {
    if (!this.targetId) return _util_modules__WEBPACK_IMPORTED_MODULE_0__["default"].Orientation.Up;
    var position = this.map.idToPosition(this.targetId);
    if (position.x > this.player.x) return _util_modules__WEBPACK_IMPORTED_MODULE_0__["default"].Orientation.Right;else if (position.x < this.player.x) return _util_modules__WEBPACK_IMPORTED_MODULE_0__["default"].Orientation.Left;else if (position.y > this.player.y) return _util_modules__WEBPACK_IMPORTED_MODULE_0__["default"].Orientation.Down;else position.y < this.player.y;
    return _util_modules__WEBPACK_IMPORTED_MODULE_0__["default"].Orientation.Up;
  }

  getData() {
    return {
      experience: this.experience
    };
  }

}

/* harmony default export */ __webpack_exports__["default"] = (Profession);

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9nYW1lL2VudGl0eS9jaGFyYWN0ZXIvcGxheWVyL3Byb2Zlc3Npb25zL2ltcGwvbHVtYmVyamFja2luZy50cyIsIndlYnBhY2s6Ly8vLi9nYW1lL2VudGl0eS9jaGFyYWN0ZXIvcGxheWVyL3Byb2Zlc3Npb25zL2ltcGwvcHJvZmVzc2lvbi50cyJdLCJuYW1lcyI6WyJMdW1iZXJqYWNraW5nIiwiUHJvZmVzc2lvbiIsImNvbnN0cnVjdG9yIiwiaWQiLCJwbGF5ZXIiLCJ0aWNrIiwiY3V0dGluZ0ludGVydmFsIiwic3RhcnRlZCIsInN0YXJ0Iiwic2V0SW50ZXJ2YWwiLCJpc1RhcmdldCIsIndvcmxkIiwiaXNUcmVlQ3V0IiwidGFyZ2V0SWQiLCJzdG9wIiwidHJlZUlkIiwiaW52ZW50b3J5IiwiY2FuSG9sZCIsIlRyZWVzIiwiTG9ncyIsIm5vdGlmeSIsInN5bmMiLCJzZW5kVG9SZWdpb24iLCJNZXNzYWdlcyIsIkFuaW1hdGlvbiIsImluc3RhbmNlIiwiYWN0aW9uIiwiTW9kdWxlcyIsIkFjdGlvbnMiLCJBdHRhY2siLCJwcm9iYWJpbGl0eSIsIkZvcm11bGFzIiwiZ2V0VHJlZUNoYW5jZSIsIlV0aWxzIiwicmFuZG9tSW50IiwiYWRkRXhwZXJpZW5jZSIsIkV4cGVyaWVuY2UiLCJhZGQiLCJjb3VudCIsImdldFRyZWVEZXN0cm95Q2hhbmNlIiwiZGVzdHJveVRyZWUiLCJlIiwiY2xlYXJJbnRlcnZhbCIsImhhbmRsZSIsImhhc0x1bWJlcmphY2tpbmdXZWFwb24iLCJsZXZlbCIsIkxldmVscyIsIkNoYW5jZXMiLCJnZXRRdWV1ZUNvdW50IiwiT2JqZWN0Iiwia2V5cyIsInF1ZXVlZFRyZWVzIiwibGVuZ3RoIiwibmFtZSIsIm1hcCIsInJlZ2lvbiIsImV4cGVyaWVuY2UiLCJsb2FkIiwiZGF0YSIsImV4cFRvTGV2ZWwiLCJuZXh0RXhwZXJpZW5jZSIsIm5leHRFeHAiLCJwcmV2RXhwZXJpZW5jZSIsInByZXZFeHAiLCJvbGRMZXZlbCIsInBvcHVwIiwic2VuZCIsIlBhY2tldHMiLCJFeHBlcmllbmNlT3Bjb2RlIiwiYW1vdW50IiwiUHJvZmVzc2lvbk9wY29kZSIsIlVwZGF0ZSIsInBlcmNlbnRhZ2UiLCJnZXRQZXJjZW50YWdlIiwic2F2ZSIsImdldExldmVsIiwiQ29uc3RhbnRzIiwiTUFYX1BST0ZFU1NJT05fTEVWRUwiLCJzZW5kVG9BZGphY2VudFJlZ2lvbnMiLCJTeW5jIiwib3JpZW50YXRpb24iLCJnZXRPcmllbnRhdGlvbiIsInRhcmdldCIsInRvRml4ZWQiLCJPcmllbnRhdGlvbiIsIlVwIiwicG9zaXRpb24iLCJpZFRvUG9zaXRpb24iLCJ4IiwiUmlnaHQiLCJMZWZ0IiwieSIsIkRvd24iLCJnZXREYXRhIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0k7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUosTUFBTUEsYUFBTixTQUE0QkMsbURBQTVCLENBQXVDO0FBRW5DQyxhQUFXLENBQUNDLEVBQUQsRUFBS0MsTUFBTCxFQUFhO0FBQ3BCLFVBQU1ELEVBQU4sRUFBVUMsTUFBVixFQUFrQixlQUFsQjtBQUVBLFNBQUtDLElBQUwsR0FBWSxJQUFaO0FBRUEsU0FBS0MsZUFBTCxHQUF1QixJQUF2QjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0g7O0FBRURDLE9BQUssR0FBRztBQUNKLFFBQUksS0FBS0QsT0FBVCxFQUNJO0FBRUosU0FBS0QsZUFBTCxHQUF1QkcsV0FBVyxDQUFDLE1BQU07QUFFckMsVUFBSTtBQUVBLFlBQUksQ0FBQyxLQUFLTCxNQUFOLElBQWdCLENBQUMsS0FBS00sUUFBTCxFQUFqQixJQUFvQyxLQUFLQyxLQUFMLENBQVdDLFNBQVgsQ0FBcUIsS0FBS0MsUUFBMUIsQ0FBeEMsRUFBNkU7QUFDekUsZUFBS0MsSUFBTDtBQUNBO0FBQ0g7O0FBRUQsWUFBSSxDQUFDLEtBQUtDLE1BQU4sSUFBZ0IsQ0FBQyxLQUFLRixRQUEx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QSxJQUFJSixRQUFRLENBQUNLLENBQVQsR0FBYSxLQUFLdkYsTUFBTCxDQUFZdUYsQ0FBN0IsRUFDRCxPQUFPaEUscURBQU8sQ0FBQ3lELFdBQVIsQ0FBb0JRLElBQTNCLENBREMsS0FFQ04sUUFBUSxDQUFDSyxDQUFULEdBQWEsS0FBS3ZGLE1BQUwsQ0FBWXVGLENBQTFCO0FBQ0QsV0FBT2hFLHFEQUFPLENBQUN5RCxXQUFSLENBQW9CQyxFQUEzQjtBQUNQOztBQUVEUSxTQUFPLEdBQUc7QUFDTixXQUFPO0FBQ0hyQyxnQkFBVSxFQUFFLEtBQUtBO0FBRGQsS0FBUDtBQUdIOztBQTVHWTs7QUErR0Z2RCx5RUFBZixFIiwiZmlsZSI6IjEuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcclxuICAgIGltcG9ydCBQcm9mZXNzaW9uIGZyb20gJy4vcHJvZmVzc2lvbic7XHJcbiAgICBpbXBvcnQgUGFja2V0cyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi9uZXR3b3JrL3BhY2tldHMnO1xyXG4gICAgaW1wb3J0IE1lc3NhZ2VzIGZyb20gJy4uLy4uLy4uLy4uLy4uLy4uL25ldHdvcmsvbWVzc2FnZXMnO1xyXG4gICAgaW1wb3J0IE1vZHVsZXMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vdXRpbC9tb2R1bGVzJztcclxuICAgIGltcG9ydCBGb3JtdWxhcyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL2Zvcm11bGFzJztcclxuICAgIGltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL3V0aWxzJztcclxuICAgIGltcG9ydCBUcmVlcyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi8uLi9kYXRhL3Byb2Zlc3Npb25zL3RyZWVzJztcclxuXHJcbmNsYXNzIEx1bWJlcmphY2tpbmcgZXh0ZW5kcyBQcm9mZXNzaW9uIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgcGxheWVyKSB7XHJcbiAgICAgICAgc3VwZXIoaWQsIHBsYXllciwgJ0x1bWJlcmphY2tpbmcnKTtcclxuXHJcbiAgICAgICAgdGhpcy50aWNrID0gMTAwMDtcclxuXHJcbiAgICAgICAgdGhpcy5jdXR0aW5nSW50ZXJ2YWwgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0ZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5jdXR0aW5nSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5wbGF5ZXIgfHwgIXRoaXMuaXNUYXJnZXQoKSB8fCB0aGlzLndvcmxkLmlzVHJlZUN1dCh0aGlzLnRhcmdldElkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudHJlZUlkIHx8ICF0aGlzLnRhcmdldElkKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucGxheWVyLmludmVudG9yeS5jYW5Ib2xkKFRyZWVzLkxvZ3NbdGhpcy50cmVlSWRdLCAxKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheWVyLm5vdGlmeSgnWW91IGRvIG5vdCBoYXZlIGVub3VnaCBzcGFjZSBpbiB5b3VyIGludmVudG9yeSEnKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zeW5jKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllci5zZW5kVG9SZWdpb24obmV3IE1lc3NhZ2VzLkFuaW1hdGlvbih0aGlzLnBsYXllci5pbnN0YW5jZSwge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogTW9kdWxlcy5BY3Rpb25zLkF0dGFja1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBwcm9iYWJpbGl0eSA9IEZvcm11bGFzLmdldFRyZWVDaGFuY2UodGhpcy5wbGF5ZXIsIHRoaXMudHJlZUlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoVXRpbHMucmFuZG9tSW50KDAsIHByb2JhYmlsaXR5KSA9PT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRXhwZXJpZW5jZShUcmVlcy5FeHBlcmllbmNlW3RoaXMudHJlZUlkXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheWVyLmludmVudG9yeS5hZGQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogVHJlZXMuTG9nc1t0aGlzLnRyZWVJZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiAxXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldFRyZWVEZXN0cm95Q2hhbmNlKCkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud29ybGQuZGVzdHJveVRyZWUodGhpcy50YXJnZXRJZCwgTW9kdWxlcy5UcmVlc1t0aGlzLnRyZWVJZF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cclxuXHJcbiAgICAgICAgfSwgdGhpcy50aWNrKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMudHJlZUlkID0gbnVsbDtcclxuICAgICAgICB0aGlzLnRhcmdldElkID0gbnVsbDtcclxuXHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmN1dHRpbmdJbnRlcnZhbCk7XHJcbiAgICAgICAgdGhpcy5jdXR0aW5nSW50ZXJ2YWwgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBoYW5kbGUoaWQsIHRyZWVJZCkge1xyXG4gICAgICAgIGlmICghdGhpcy5wbGF5ZXIuaGFzTHVtYmVyamFja2luZ1dlYXBvbigpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGxheWVyLm5vdGlmeSgnWW91IGRvIG5vdCBoYXZlIGFuIGF4ZSB0byBjdXQgdGhpcyB0cmVlIHdpdGguJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZUlkID0gdHJlZUlkO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0SWQgPSBpZDtcclxuXHJcbiAgICAgICAgdGhpcy53b3JsZC5kZXN0cm95VHJlZSh0aGlzLnRhcmdldElkLCBNb2R1bGVzLlRyZWVzW3RoaXMudHJlZUlkXSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmxldmVsIDwgVHJlZXMuTGV2ZWxzW3RoaXMudHJlZUlkXSkge1xyXG4gICAgICAgICAgICB0aGlzLnBsYXllci5ub3RpZnkoYFlvdSBtdXN0IGJlIGF0IGxlYXN0IGxldmVsICR7VHJlZXMuTGV2ZWxzW3RoaXMudHJlZUlkXX0gdG8gY3V0IHRoaXMgdHJlZSFgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy90aGlzLnN0YXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VHJlZURlc3Ryb3lDaGFuY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIFV0aWxzLnJhbmRvbUludCgwLCBUcmVlcy5DaGFuY2VzW3RoaXMudHJlZUlkXSkgPT09IDI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UXVldWVDb3VudCgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5xdWV1ZWRUcmVlcykubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgTHVtYmVyamFja2luZztcclxuIiwiaW1wb3J0IE1vZHVsZXMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vdXRpbC9tb2R1bGVzJztcclxuICAgIGltcG9ydCBGb3JtdWxhcyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL2Zvcm11bGFzJztcclxuICAgIGltcG9ydCBDb25zdGFudHMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vdXRpbC9jb25zdGFudHMnO1xyXG4gICAgaW1wb3J0IE1lc3NhZ2VzIGZyb20gJy4uLy4uLy4uLy4uLy4uLy4uL25ldHdvcmsvbWVzc2FnZXMnO1xyXG4gICAgaW1wb3J0IFBhY2tldHMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vbmV0d29yay9wYWNrZXRzJztcclxuXHJcbmNsYXNzIFByb2Zlc3Npb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlkLCBwbGF5ZXIsIG5hbWUpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgICAgIHRoaXMucGxheWVyID0gcGxheWVyO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7IC8vIFRoZSBwcm9mZXNzaW9uIG5hbWVcclxuXHJcbiAgICAgICAgdGhpcy53b3JsZCA9IHBsYXllci53b3JsZDtcclxuXHJcbiAgICAgICAgdGhpcy5tYXAgPSB0aGlzLndvcmxkLm1hcDtcclxuICAgICAgICB0aGlzLnJlZ2lvbiA9IHRoaXMud29ybGQucmVnaW9uO1xyXG5cclxuICAgICAgICB0aGlzLmV4cGVyaWVuY2UgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLnRhcmdldElkID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKGRhdGEpIHtcclxuXHJcbiAgICAgICAgdGhpcy5leHBlcmllbmNlID0gZGF0YS5leHBlcmllbmNlO1xyXG5cclxuICAgICAgICB0aGlzLmxldmVsID0gRm9ybXVsYXMuZXhwVG9MZXZlbCh0aGlzLmV4cGVyaWVuY2UpO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRFeHBlcmllbmNlID0gRm9ybXVsYXMubmV4dEV4cCh0aGlzLmV4cGVyaWVuY2UpO1xyXG4gICAgICAgIHRoaXMucHJldkV4cGVyaWVuY2UgPSBGb3JtdWxhcy5wcmV2RXhwKHRoaXMuZXhwZXJpZW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRXhwZXJpZW5jZShleHBlcmllbmNlKSB7XHJcbiAgICAgICAgdGhpcy5leHBlcmllbmNlICs9IGV4cGVyaWVuY2U7XHJcblxyXG4gICAgICAgIGxldCBvbGRMZXZlbCA9IHRoaXMubGV2ZWw7XHJcblxyXG4gICAgICAgIHRoaXMubGV2ZWwgPSBGb3JtdWxhcy5leHBUb0xldmVsKHRoaXMuZXhwZXJpZW5jZSk7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEV4cGVyaWVuY2UgPSBGb3JtdWxhcy5uZXh0RXhwKHRoaXMuZXhwZXJpZW5jZSk7XHJcbiAgICAgICAgdGhpcy5wcmV2RXhwZXJpZW5jZSA9IEZvcm11bGFzLnByZXZFeHAodGhpcy5leHBlcmllbmNlKTtcclxuXHJcbiAgICAgICAgaWYgKG9sZExldmVsICE9PSB0aGlzLmxldmVsKVxyXG4gICAgICAgICAgICB0aGlzLnBsYXllci5wb3B1cCgnUHJvZmVzc2lvbiBMZXZlbCBVcCEnLCBgQ29uZ3JhdHVsYXRpb25zLCB5b3VyICR7dGhpcy5uYW1lfSBsZXZlbCBpcyBub3cgJHt0aGlzLmxldmVsfS5gLCAnIzk5MzNmZicpO1xyXG5cclxuICAgICAgICB0aGlzLnBsYXllci5zZW5kKG5ldyBNZXNzYWdlcy5FeHBlcmllbmNlKFBhY2tldHMuRXhwZXJpZW5jZU9wY29kZS5Qcm9mZXNzaW9uLCB7XHJcbiAgICAgICAgICAgIGlkOiB0aGlzLnBsYXllci5pbnN0YW5jZSxcclxuICAgICAgICAgICAgYW1vdW50OiBleHBlcmllbmNlXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLnBsYXllci5zZW5kKG5ldyBNZXNzYWdlcy5Qcm9mZXNzaW9uKFBhY2tldHMuUHJvZmVzc2lvbk9wY29kZS5VcGRhdGUsIHtcclxuICAgICAgICAgICAgaWQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIGxldmVsOiB0aGlzLmxldmVsLFxyXG4gICAgICAgICAgICBwZXJjZW50YWdlOiB0aGlzLmdldFBlcmNlbnRhZ2UoKVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5ZXIuc2F2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgcmV0dXJuICdOb3QgaW1wbGVtZW50ZWQuJztcclxuICAgIH1cclxuXHJcbiAgICBnZXRMZXZlbCgpIHtcclxuICAgICAgICBsZXQgbGV2ZWwgPSBGb3JtdWxhcy5leHBUb0xldmVsKHRoaXMuZXhwZXJpZW5jZSk7XHJcblxyXG4gICAgICAgIGlmIChsZXZlbCA+IENvbnN0YW50cy5NQVhfUFJPRkVTU0lPTl9MRVZFTClcclxuICAgICAgICAgICAgbGV2ZWwgPSBDb25zdGFudHMuTUFYX1BST0ZFU1NJT05fTEVWRUw7XHJcblxyXG4gICAgICAgIHJldHVybiBsZXZlbDtcclxuICAgIH1cclxuXHJcbiAgICBzeW5jKCkge1xyXG5cclxuICAgICAgICB0aGlzLnBsYXllci5zZW5kVG9BZGphY2VudFJlZ2lvbnModGhpcy5wbGF5ZXIucmVnaW9uLCBuZXcgTWVzc2FnZXMuU3luYyh7XHJcbiAgICAgICAgICAgIGlkOiB0aGlzLnBsYXllci5pbnN0YW5jZSxcclxuICAgICAgICAgICAgb3JpZW50YXRpb246IHRoaXMuZ2V0T3JpZW50YXRpb24oKVxyXG4gICAgICAgIH0pKVxyXG4gICAgfVxyXG5cclxuICAgIGlzVGFyZ2V0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci50YXJnZXQgPT09IHRoaXMudGFyZ2V0SWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UGVyY2VudGFnZSgpIHtcclxuICAgICAgICBsZXQgZXhwZXJpZW5jZSA9IHRoaXMuZXhwZXJpZW5jZSAtIHRoaXMucHJldkV4cGVyaWVuY2UsXHJcbiAgICAgICAgICAgIG5leHRFeHBlcmllbmNlID0gdGhpcy5uZXh0RXhwZXJpZW5jZSAtIHRoaXMucHJldkV4cGVyaWVuY2U7XHJcblxyXG4gICAgICAgIHJldHVybiAoZXhwZXJpZW5jZSAvIG5leHRFeHBlcmllbmNlICogMTAwKS50b0ZpeGVkKDIpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE9yaWVudGF0aW9uKCkge1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0SWQpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLlVwO1xyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLm1hcC5pZFRvUG9zaXRpb24odGhpcy50YXJnZXRJZCk7XHJcblxyXG4gICAgICAgIGlmIChwb3NpdGlvbi54ID4gdGhpcy5wbGF5ZXIueClcclxuICAgICAgICAgICAgcmV0dXJuIE1vZHVsZXMuT3JpZW50YXRpb24uUmlnaHQ7XHJcbiAgICAgICAgZWxzZSBpZiAocG9zaXRpb24ueCA8IHRoaXMucGxheWVyLngpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLkxlZnQ7XHJcbiAgICAgICAgZWxzZSBpZiAocG9zaXRpb24ueSA+IHRoaXMucGxheWVyLnkpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLkRvd247XHJcbiAgICAgICAgZWxzZSAocG9zaXRpb24ueSA8IHRoaXMucGxheWVyLnkpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLlVwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZXhwZXJpZW5jZTogdGhpcy5leHBlcmllbmNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQcm9mZXNzaW9uO1xyXG4iXSwic291cmNlUm9vdCI6IiJ9