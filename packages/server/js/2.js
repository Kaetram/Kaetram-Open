(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[2],{

/***/ "./game/entity/character/player/professions/impl/mining.ts":
/*!*****************************************************************!*\
  !*** ./game/entity/character/player/professions/impl/mining.ts ***!
  \*****************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _profession__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./profession */ "./game/entity/character/player/professions/impl/profession.ts");
/* harmony import */ var _util_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../../../util/utils */ "./util/utils.ts");
/* harmony import */ var _data_professions_rocks__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../../../data/professions/rocks */ "../data/professions/rocks.ts");




class Mining extends _profession__WEBPACK_IMPORTED_MODULE_0__["default"] {
  constructor(id, player) {
    super(id, player, 'Mining');
    this.tick = 1000;
    this.miningInterval = null;
    this.started = false;
  }

  start() {
    if (this.started) return;
    this.miningInterval = setInterval(() => {
      try {} catch (e) {}
    }, this.tick);
    this.started = true;
  }

  stop() {
    if (!this.started) return;
    this.rockId = null;
    this.targetId = null;
    clearInterval(this.miningInterval);
    this.miningInterval = null;
    this.started = false;
  }

  handle(id, rockId) {
    if (!this.player.hasMiningWeapon()) {
      this.player.notify('You do not have a pickaxe to mine this rock with.');
      return;
    }

    this.rockId = rockId;
    this.targetId = id;

    if (this.level < _data_professions_rocks__WEBPACK_IMPORTED_MODULE_2__["default"].Levels[this.rockId]) {
      this.player.notify("You must be at least level ".concat(_data_professions_rocks__WEBPACK_IMPORTED_MODULE_2__["default"].Levels[this.rockId], " to mine this rock."));
      return;
    }

    this.start();
  }

  getRockDestroyChance() {
    return _util_utils__WEBPACK_IMPORTED_MODULE_1__["default"].randomInt(0, _data_professions_rocks__WEBPACK_IMPORTED_MODULE_2__["default"].Chances[this.rockId]) === 2;
  }

}

/* harmony default export */ __webpack_exports__["default"] = (Mining);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9nYW1lL2VudGl0eS9jaGFyYWN0ZXIvcGxheWVyL3Byb2Zlc3Npb25zL2ltcGwvbWluaW5nLnRzIiwid2VicGFjazovLy8uL2dhbWUvZW50aXR5L2NoYXJhY3Rlci9wbGF5ZXIvcHJvZmVzc2lvbnMvaW1wbC9wcm9mZXNzaW9uLnRzIl0sIm5hbWVzIjpbIk1pbmluZyIsIlByb2Zlc3Npb24iLCJjb25zdHJ1Y3RvciIsImlkIiwicGxheWVyIiwidGljayIsIm1pbmluZ0ludGVydmFsIiwic3RhcnRlZCIsInN0YXJ0Iiwic2V0SW50ZXJ2YWwiLCJlIiwic3RvcCIsInJvY2tJZCIsInRhcmdldElkIiwiY2xlYXJJbnRlcnZhbCIsImhhbmRsZSIsImhhc01pbmluZ1dlYXBvbiIsIm5vdGlmeSIsImxldmVsIiwiUm9ja3MiLCJMZXZlbHMiLCJnZXRSb2NrRGVzdHJveUNoYW5jZSIsIlV0aWxzIiwicmFuZG9tSW50IiwiQ2hhbmNlcyIsIm5hbWUiLCJ3b3JsZCIsIm1hcCIsInJlZ2lvbiIsImV4cGVyaWVuY2UiLCJsb2FkIiwiZGF0YSIsIkZvcm11bGFzIiwiZXhwVG9MZXZlbCIsIm5leHRFeHBlcmllbmNlIiwibmV4dEV4cCIsInByZXZFeHBlcmllbmNlIiwicHJldkV4cCIsImFkZEV4cGVyaWVuY2UiLCJvbGRMZXZlbCIsInBvcHVwIiwic2VuZCIsIk1lc3NhZ2VzIiwiRXhwZXJpZW5jZSIsIlBhY2tldHMiLCJFeHBlcmllbmNlT3Bjb2RlIiwiaW5zdGFuY2UiLCJhbW91bnQiLCJQcm9mZXNzaW9uT3Bjb2RlIiwiVXBkYXRlIiwicGVyY2VudGFnZSIsImdldFBlcmNlbnRhZ2UiLCJzYXZlIiwiZ2V0TGV2ZWwiLCJDb25zdGFudHMiLCJNQVhfUFJPRkVTU0lPTl9MRVZFTCIsInN5bmMiLCJzZW5kVG9BZGphY2VudFJlZ2lvbnMiLCJTeW5jIiwib3JpZW50YXRpb24iLCJnZXRPcmllbnRhdGlvbiIsImlzVGFyZ2V0IiwidGFyZ2V0IiwidG9GaXhlZCIsIk1vZHVsZXMiLCJPcmllbnRhdGlvbiIsIlVwIiwicG9zaXRpb24iLCJpZFRvUG9zaXRpb24iLCJ4IiwiUmlnaHQiLCJMZWZ0IiwieSIsIkRvd24iLCJnZXREYXRhIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0k7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUtBO0FBQ0E7O0FBRUosTUFBTUEsTUFBTixTQUFxQkMsbURBQXJCLENBQWdDO0FBRTVCQyxhQUFXLENBQUNDLEVBQUQsRUFBS0MsTUFBTCxFQUFhO0FBQ3BCLFVBQU1ELEVBQU4sRUFBVUMsTUFBVixFQUFrQixRQUFsQjtBQUVBLFNBQUtDLElBQUwsR0FBWSxJQUFaO0FBRUEsU0FBS0MsY0FBTCxHQUFzQixJQUF0QjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0g7O0FBRURDLE9BQUssR0FBRztBQUNKLFFBQUksS0FBS0QsT0FBVCxFQUNJO0FBRUosU0FBS0QsY0FBTCxHQUFzQkcsV0FBVyxDQUFDLE1BQU07QUFFcEMsVUFBSSxDQUlILENBSkQsQ0FJRSxPQUFPQyxDQUFQLEVBQVUsQ0FBRTtBQUVqQixLQVJnQyxFQVE5QixLQUFLTCxJQVJ5QixDQUFqQztBQVVBLFNBQUtFLE9BQUwsR0FBZSxJQUFmO0FBQ0g7O0FBRURJLE1BQUksR0FBRztBQUNILFFBQUksQ0FBQyxLQUFLSixPQUFWLEVBQ0k7QUFFSixTQUFLSyxNQUFMLEdBQWMsSUFBZDtBQUNBLFNBQUtDLFFBQUwsR0FBZ0IsSUFBaEI7QUFFQUMsaUJBQWEsQ0FBQyxLQUFLUixjQUFOLENBQWI7QUFDQSxTQUFLQSxjQUFMLEdBQXNCLElBQXRCO0FBRUEsU0FBS0MsT0FBTCxHQUFlLEtBQWY7QUFDSDs7QUFFRFEsUUFBTSxDQUFDWixFQUFELEVBQUtTLE1BQUwsRUFBYTtBQUNmLFFBQUksQ0FBQyxLQUFLUixNQUFMLENBQVlZLGVBQVosRUFBTCxFQUFvQztBQUNoQyxXQUFLWixNQUFMLENBQVlhLE1BQVosQ0FBbUIsbURBQW5CO0FBQ0E7QUFDSDs7QUFFRCxTQUFLTCxN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SUMsUUFBUSxHQUFHLEtBQUt4QyxHQUFMLENBQVN5QyxZQUFULENBQXNCLEtBQUt2RCxRQUEzQixDQUFmO0FBRUEsUUFBSXNELFFBQVEsQ0FBQ0UsQ0FBVCxHQUFhLEtBQUtqRSxNQUFMLENBQVlpRSxDQUE3QixFQUNJLE9BQU9MLHFEQUFPLENBQUNDLFdBQVIsQ0FBb0JLLEtBQTNCLENBREosS0FFSyxJQUFJSCxRQUFRLENBQUNFLENBQVQsR0FBYSxLQUFLakUsTUFBTCxDQUFZaUUsQ0FBN0IsRUFDRCxPQUFPTCxxREFBTyxDQUFDQyxXQUFSLENBQW9CTSxJQUEzQixDQURDLEtBRUEsSUFBSUosUUFBUSxDQUFDSyxDQUFULEdBQWEsS0FBS3BFLE1BQUwsQ0FBWW9FLENBQTdCLEVBQ0QsT0FBT1IscURBQU8sQ0FBQ0MsV0FBUixDQUFvQlEsSUFBM0IsQ0FEQyxLQUVDTixRQUFRLENBQUNLLENBQVQsR0FBYSxLQUFLcEUsTUFBTCxDQUFZb0UsQ0FBMUI7QUFDRCxXQUFPUixxREFBTyxDQUFDQyxXQUFSLENBQW9CQyxFQUEzQjtBQUNQOztBQUVEUSxTQUFPLEdBQUc7QUFDTixXQUFPO0FBQ0g3QyxnQkFBVSxFQUFFLEtBQUtBO0FBRGQsS0FBUDtBQUdIOztBQTVHWTs7QUErR0Y1Qix5RUFBZixFIiwiZmlsZSI6IjIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcclxuICAgIGltcG9ydCBQcm9mZXNzaW9uIGZyb20gJy4vcHJvZmVzc2lvbic7XHJcbiAgICBpbXBvcnQgUGFja2V0cyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi9uZXR3b3JrL3BhY2tldHMnO1xyXG4gICAgaW1wb3J0IE1lc3NhZ2VzIGZyb20gJy4uLy4uLy4uLy4uLy4uLy4uL25ldHdvcmsvbWVzc2FnZXMnO1xyXG4gICAgaW1wb3J0IE1vZHVsZXMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vdXRpbC9tb2R1bGVzJztcclxuICAgIGltcG9ydCBGb3JtdWxhcyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL2Zvcm11bGFzJztcclxuICAgIGltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL3V0aWxzJztcclxuICAgIGltcG9ydCBSb2NrcyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi8uLi9kYXRhL3Byb2Zlc3Npb25zL3JvY2tzJztcclxuXHJcbmNsYXNzIE1pbmluZyBleHRlbmRzIFByb2Zlc3Npb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlkLCBwbGF5ZXIpIHtcclxuICAgICAgICBzdXBlcihpZCwgcGxheWVyLCAnTWluaW5nJyk7XHJcblxyXG4gICAgICAgIHRoaXMudGljayA9IDEwMDA7XHJcblxyXG4gICAgICAgIHRoaXMubWluaW5nSW50ZXJ2YWwgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0KCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXJ0ZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5taW5pbmdJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcblxyXG4gICAgICAgIH0sIHRoaXMudGljayk7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuc3RhcnRlZClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLnJvY2tJZCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy50YXJnZXRJZCA9IG51bGw7XHJcblxyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5taW5pbmdJbnRlcnZhbCk7XHJcbiAgICAgICAgdGhpcy5taW5pbmdJbnRlcnZhbCA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGhhbmRsZShpZCwgcm9ja0lkKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnBsYXllci5oYXNNaW5pbmdXZWFwb24oKSkge1xyXG4gICAgICAgICAgICB0aGlzLnBsYXllci5ub3RpZnkoJ1lvdSBkbyBub3QgaGF2ZSBhIHBpY2theGUgdG8gbWluZSB0aGlzIHJvY2sgd2l0aC4nKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yb2NrSWQgPSByb2NrSWQ7XHJcbiAgICAgICAgdGhpcy50YXJnZXRJZCA9IGlkO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5sZXZlbCA8IFJvY2tzLkxldmVsc1t0aGlzLnJvY2tJZF0pIHtcclxuICAgICAgICAgICAgdGhpcy5wbGF5ZXIubm90aWZ5KGBZb3UgbXVzdCBiZSBhdCBsZWFzdCBsZXZlbCAke1JvY2tzLkxldmVsc1t0aGlzLnJvY2tJZF19IHRvIG1pbmUgdGhpcyByb2NrLmApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Um9ja0Rlc3Ryb3lDaGFuY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIFV0aWxzLnJhbmRvbUludCgwLCBSb2Nrcy5DaGFuY2VzW3RoaXMucm9ja0lkXSkgPT09IDI7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE1pbmluZztcclxuIiwiaW1wb3J0IE1vZHVsZXMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vdXRpbC9tb2R1bGVzJztcclxuICAgIGltcG9ydCBGb3JtdWxhcyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL2Zvcm11bGFzJztcclxuICAgIGltcG9ydCBDb25zdGFudHMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vdXRpbC9jb25zdGFudHMnO1xyXG4gICAgaW1wb3J0IE1lc3NhZ2VzIGZyb20gJy4uLy4uLy4uLy4uLy4uLy4uL25ldHdvcmsvbWVzc2FnZXMnO1xyXG4gICAgaW1wb3J0IFBhY2tldHMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vbmV0d29yay9wYWNrZXRzJztcclxuXHJcbmNsYXNzIFByb2Zlc3Npb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlkLCBwbGF5ZXIsIG5hbWUpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgICAgIHRoaXMucGxheWVyID0gcGxheWVyO1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7IC8vIFRoZSBwcm9mZXNzaW9uIG5hbWVcclxuXHJcbiAgICAgICAgdGhpcy53b3JsZCA9IHBsYXllci53b3JsZDtcclxuXHJcbiAgICAgICAgdGhpcy5tYXAgPSB0aGlzLndvcmxkLm1hcDtcclxuICAgICAgICB0aGlzLnJlZ2lvbiA9IHRoaXMud29ybGQucmVnaW9uO1xyXG5cclxuICAgICAgICB0aGlzLmV4cGVyaWVuY2UgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLnRhcmdldElkID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKGRhdGEpIHtcclxuXHJcbiAgICAgICAgdGhpcy5leHBlcmllbmNlID0gZGF0YS5leHBlcmllbmNlO1xyXG5cclxuICAgICAgICB0aGlzLmxldmVsID0gRm9ybXVsYXMuZXhwVG9MZXZlbCh0aGlzLmV4cGVyaWVuY2UpO1xyXG5cclxuICAgICAgICB0aGlzLm5leHRFeHBlcmllbmNlID0gRm9ybXVsYXMubmV4dEV4cCh0aGlzLmV4cGVyaWVuY2UpO1xyXG4gICAgICAgIHRoaXMucHJldkV4cGVyaWVuY2UgPSBGb3JtdWxhcy5wcmV2RXhwKHRoaXMuZXhwZXJpZW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRXhwZXJpZW5jZShleHBlcmllbmNlKSB7XHJcbiAgICAgICAgdGhpcy5leHBlcmllbmNlICs9IGV4cGVyaWVuY2U7XHJcblxyXG4gICAgICAgIGxldCBvbGRMZXZlbCA9IHRoaXMubGV2ZWw7XHJcblxyXG4gICAgICAgIHRoaXMubGV2ZWwgPSBGb3JtdWxhcy5leHBUb0xldmVsKHRoaXMuZXhwZXJpZW5jZSk7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEV4cGVyaWVuY2UgPSBGb3JtdWxhcy5uZXh0RXhwKHRoaXMuZXhwZXJpZW5jZSk7XHJcbiAgICAgICAgdGhpcy5wcmV2RXhwZXJpZW5jZSA9IEZvcm11bGFzLnByZXZFeHAodGhpcy5leHBlcmllbmNlKTtcclxuXHJcbiAgICAgICAgaWYgKG9sZExldmVsICE9PSB0aGlzLmxldmVsKVxyXG4gICAgICAgICAgICB0aGlzLnBsYXllci5wb3B1cCgnUHJvZmVzc2lvbiBMZXZlbCBVcCEnLCBgQ29uZ3JhdHVsYXRpb25zLCB5b3VyICR7dGhpcy5uYW1lfSBsZXZlbCBpcyBub3cgJHt0aGlzLmxldmVsfS5gLCAnIzk5MzNmZicpO1xyXG5cclxuICAgICAgICB0aGlzLnBsYXllci5zZW5kKG5ldyBNZXNzYWdlcy5FeHBlcmllbmNlKFBhY2tldHMuRXhwZXJpZW5jZU9wY29kZS5Qcm9mZXNzaW9uLCB7XHJcbiAgICAgICAgICAgIGlkOiB0aGlzLnBsYXllci5pbnN0YW5jZSxcclxuICAgICAgICAgICAgYW1vdW50OiBleHBlcmllbmNlXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLnBsYXllci5zZW5kKG5ldyBNZXNzYWdlcy5Qcm9mZXNzaW9uKFBhY2tldHMuUHJvZmVzc2lvbk9wY29kZS5VcGRhdGUsIHtcclxuICAgICAgICAgICAgaWQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIGxldmVsOiB0aGlzLmxldmVsLFxyXG4gICAgICAgICAgICBwZXJjZW50YWdlOiB0aGlzLmdldFBlcmNlbnRhZ2UoKVxyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5ZXIuc2F2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgcmV0dXJuICdOb3QgaW1wbGVtZW50ZWQuJztcclxuICAgIH1cclxuXHJcbiAgICBnZXRMZXZlbCgpIHtcclxuICAgICAgICBsZXQgbGV2ZWwgPSBGb3JtdWxhcy5leHBUb0xldmVsKHRoaXMuZXhwZXJpZW5jZSk7XHJcblxyXG4gICAgICAgIGlmIChsZXZlbCA+IENvbnN0YW50cy5NQVhfUFJPRkVTU0lPTl9MRVZFTClcclxuICAgICAgICAgICAgbGV2ZWwgPSBDb25zdGFudHMuTUFYX1BST0ZFU1NJT05fTEVWRUw7XHJcblxyXG4gICAgICAgIHJldHVybiBsZXZlbDtcclxuICAgIH1cclxuXHJcbiAgICBzeW5jKCkge1xyXG5cclxuICAgICAgICB0aGlzLnBsYXllci5zZW5kVG9BZGphY2VudFJlZ2lvbnModGhpcy5wbGF5ZXIucmVnaW9uLCBuZXcgTWVzc2FnZXMuU3luYyh7XHJcbiAgICAgICAgICAgIGlkOiB0aGlzLnBsYXllci5pbnN0YW5jZSxcclxuICAgICAgICAgICAgb3JpZW50YXRpb246IHRoaXMuZ2V0T3JpZW50YXRpb24oKVxyXG4gICAgICAgIH0pKVxyXG4gICAgfVxyXG5cclxuICAgIGlzVGFyZ2V0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBsYXllci50YXJnZXQgPT09IHRoaXMudGFyZ2V0SWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UGVyY2VudGFnZSgpIHtcclxuICAgICAgICBsZXQgZXhwZXJpZW5jZSA9IHRoaXMuZXhwZXJpZW5jZSAtIHRoaXMucHJldkV4cGVyaWVuY2UsXHJcbiAgICAgICAgICAgIG5leHRFeHBlcmllbmNlID0gdGhpcy5uZXh0RXhwZXJpZW5jZSAtIHRoaXMucHJldkV4cGVyaWVuY2U7XHJcblxyXG4gICAgICAgIHJldHVybiAoZXhwZXJpZW5jZSAvIG5leHRFeHBlcmllbmNlICogMTAwKS50b0ZpeGVkKDIpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldE9yaWVudGF0aW9uKCkge1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMudGFyZ2V0SWQpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLlVwO1xyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLm1hcC5pZFRvUG9zaXRpb24odGhpcy50YXJnZXRJZCk7XHJcblxyXG4gICAgICAgIGlmIChwb3NpdGlvbi54ID4gdGhpcy5wbGF5ZXIueClcclxuICAgICAgICAgICAgcmV0dXJuIE1vZHVsZXMuT3JpZW50YXRpb24uUmlnaHQ7XHJcbiAgICAgICAgZWxzZSBpZiAocG9zaXRpb24ueCA8IHRoaXMucGxheWVyLngpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLkxlZnQ7XHJcbiAgICAgICAgZWxzZSBpZiAocG9zaXRpb24ueSA+IHRoaXMucGxheWVyLnkpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLkRvd247XHJcbiAgICAgICAgZWxzZSAocG9zaXRpb24ueSA8IHRoaXMucGxheWVyLnkpXHJcbiAgICAgICAgICAgIHJldHVybiBNb2R1bGVzLk9yaWVudGF0aW9uLlVwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldERhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZXhwZXJpZW5jZTogdGhpcy5leHBlcmllbmNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQcm9mZXNzaW9uO1xyXG4iXSwic291cmNlUm9vdCI6IiJ9