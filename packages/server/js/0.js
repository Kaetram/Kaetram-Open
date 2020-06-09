(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "./game/entity/character/player/professions/impl/fishing.ts":
/*!******************************************************************!*\
  !*** ./game/entity/character/player/professions/impl/fishing.ts ***!
  \******************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _profession__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./profession */ "./game/entity/character/player/professions/impl/profession.ts");


class Fishing extends _profession__WEBPACK_IMPORTED_MODULE_0__["default"] {
  constructor(id, player) {
    super(id, player, 'Fishing');
    this.tick = 1000;
  }

}

/* harmony default export */ __webpack_exports__["default"] = (Fishing);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9nYW1lL2VudGl0eS9jaGFyYWN0ZXIvcGxheWVyL3Byb2Zlc3Npb25zL2ltcGwvZmlzaGluZy50cyIsIndlYnBhY2s6Ly8vLi9nYW1lL2VudGl0eS9jaGFyYWN0ZXIvcGxheWVyL3Byb2Zlc3Npb25zL2ltcGwvcHJvZmVzc2lvbi50cyJdLCJuYW1lcyI6WyJGaXNoaW5nIiwiUHJvZmVzc2lvbiIsImNvbnN0cnVjdG9yIiwiaWQiLCJwbGF5ZXIiLCJ0aWNrIiwibmFtZSIsIndvcmxkIiwibWFwIiwicmVnaW9uIiwiZXhwZXJpZW5jZSIsInRhcmdldElkIiwibG9hZCIsImRhdGEiLCJsZXZlbCIsIkZvcm11bGFzIiwiZXhwVG9MZXZlbCIsIm5leHRFeHBlcmllbmNlIiwibmV4dEV4cCIsInByZXZFeHBlcmllbmNlIiwicHJldkV4cCIsImFkZEV4cGVyaWVuY2UiLCJvbGRMZXZlbCIsInBvcHVwIiwic2VuZCIsIk1lc3NhZ2VzIiwiRXhwZXJpZW5jZSIsIlBhY2tldHMiLCJFeHBlcmllbmNlT3Bjb2RlIiwiaW5zdGFuY2UiLCJhbW91bnQiLCJQcm9mZXNzaW9uT3Bjb2RlIiwiVXBkYXRlIiwicGVyY2VudGFnZSIsImdldFBlcmNlbnRhZ2UiLCJzYXZlIiwic3RvcCIsImdldExldmVsIiwiQ29uc3RhbnRzIiwiTUFYX1BST0ZFU1NJT05fTEVWRUwiLCJzeW5jIiwic2VuZFRvQWRqYWNlbnRSZWdpb25zIiwiU3luYyIsIm9yaWVudGF0aW9uIiwiZ2V0T3JpZW50YXRpb24iLCJpc1RhcmdldCIsInRhcmdldCIsInRvRml4ZWQiLCJNb2R1bGVzIiwiT3JpZW50YXRpb24iLCJVcCIsInBvc2l0aW9uIiwiaWRUb1Bvc2l0aW9uIiwieCIsIlJpZ2h0IiwiTGVmdCIsInkiLCJEb3duIiwiZ2V0RGF0YSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNJO0FBQUE7QUFBQTs7QUFFSixNQUFNQSxPQUFOLFNBQXNCQyxtREFBdEIsQ0FBaUM7QUFFN0JD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M0IsQ0FEQyxLQUVBLElBQUlKLFFBQVEsQ0FBQ0ssQ0FBVCxHQUFhLEtBQUtwRCxNQUFMLENBQVlvRCxDQUE3QixFQUNELE9BQU9SLHFEQUFPLENBQUNDLFdBQVIsQ0FBb0JRLElBQTNCLENBREMsS0FFQ04sUUFBUSxDQUFDSyxDQUFULEdBQWEsS0FBS3BELE1BQUwsQ0FBWW9ELENBQTFCO0FBQ0QsV0FBT1IscURBQU8sQ0FBQ0MsV0FBUixDQUFvQkMsRUFBM0I7QUFDUDs7QUFFRFEsU0FBTyxHQUFHO0FBQ04sV0FBTztBQUNIaEQsZ0JBQVUsRUFBRSxLQUFLQTtBQURkLEtBQVA7QUFHSDs7QUE1R1k7O0FBK0dGVCx5RUFBZixFIiwiZmlsZSI6IjAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcclxuICAgIGltcG9ydCBQcm9mZXNzaW9uIGZyb20gJy4vcHJvZmVzc2lvbic7XHJcblxyXG5jbGFzcyBGaXNoaW5nIGV4dGVuZHMgUHJvZmVzc2lvbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaWQsIHBsYXllcikge1xyXG4gICAgICAgIHN1cGVyKGlkLCBwbGF5ZXIsICdGaXNoaW5nJyk7XHJcblxyXG4gICAgICAgIHRoaXMudGljayA9IDEwMDA7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGaXNoaW5nO1xyXG4iLCJpbXBvcnQgTW9kdWxlcyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL21vZHVsZXMnO1xyXG4gICAgaW1wb3J0IEZvcm11bGFzIGZyb20gJy4uLy4uLy4uLy4uLy4uLy4uL3V0aWwvZm9ybXVsYXMnO1xyXG4gICAgaW1wb3J0IENvbnN0YW50cyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi91dGlsL2NvbnN0YW50cyc7XHJcbiAgICBpbXBvcnQgTWVzc2FnZXMgZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vbmV0d29yay9tZXNzYWdlcyc7XHJcbiAgICBpbXBvcnQgUGFja2V0cyBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi9uZXR3b3JrL3BhY2tldHMnO1xyXG5cclxuY2xhc3MgUHJvZmVzc2lvbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaWQsIHBsYXllciwgbmFtZSkge1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICAgICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTsgLy8gVGhlIHByb2Zlc3Npb24gbmFtZVxyXG5cclxuICAgICAgICB0aGlzLndvcmxkID0gcGxheWVyLndvcmxkO1xyXG5cclxuICAgICAgICB0aGlzLm1hcCA9IHRoaXMud29ybGQubWFwO1xyXG4gICAgICAgIHRoaXMucmVnaW9uID0gdGhpcy53b3JsZC5yZWdpb247XHJcblxyXG4gICAgICAgIHRoaXMuZXhwZXJpZW5jZSA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMudGFyZ2V0SWQgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWQoZGF0YSkge1xyXG5cclxuICAgICAgICB0aGlzLmV4cGVyaWVuY2UgPSBkYXRhLmV4cGVyaWVuY2U7XHJcblxyXG4gICAgICAgIHRoaXMubGV2ZWwgPSBGb3JtdWxhcy5leHBUb0xldmVsKHRoaXMuZXhwZXJpZW5jZSk7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dEV4cGVyaWVuY2UgPSBGb3JtdWxhcy5uZXh0RXhwKHRoaXMuZXhwZXJpZW5jZSk7XHJcbiAgICAgICAgdGhpcy5wcmV2RXhwZXJpZW5jZSA9IEZvcm11bGFzLnByZXZFeHAodGhpcy5leHBlcmllbmNlKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRFeHBlcmllbmNlKGV4cGVyaWVuY2UpIHtcclxuICAgICAgICB0aGlzLmV4cGVyaWVuY2UgKz0gZXhwZXJpZW5jZTtcclxuXHJcbiAgICAgICAgbGV0IG9sZExldmVsID0gdGhpcy5sZXZlbDtcclxuXHJcbiAgICAgICAgdGhpcy5sZXZlbCA9IEZvcm11bGFzLmV4cFRvTGV2ZWwodGhpcy5leHBlcmllbmNlKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0RXhwZXJpZW5jZSA9IEZvcm11bGFzLm5leHRFeHAodGhpcy5leHBlcmllbmNlKTtcclxuICAgICAgICB0aGlzLnByZXZFeHBlcmllbmNlID0gRm9ybXVsYXMucHJldkV4cCh0aGlzLmV4cGVyaWVuY2UpO1xyXG5cclxuICAgICAgICBpZiAob2xkTGV2ZWwgIT09IHRoaXMubGV2ZWwpXHJcbiAgICAgICAgICAgIHRoaXMucGxheWVyLnBvcHVwKCdQcm9mZXNzaW9uIExldmVsIFVwIScsIGBDb25ncmF0dWxhdGlvbnMsIHlvdXIgJHt0aGlzLm5hbWV9IGxldmVsIGlzIG5vdyAke3RoaXMubGV2ZWx9LmAsICcjOTkzM2ZmJyk7XHJcblxyXG4gICAgICAgIHRoaXMucGxheWVyLnNlbmQobmV3IE1lc3NhZ2VzLkV4cGVyaWVuY2UoUGFja2V0cy5FeHBlcmllbmNlT3Bjb2RlLlByb2Zlc3Npb24sIHtcclxuICAgICAgICAgICAgaWQ6IHRoaXMucGxheWVyLmluc3RhbmNlLFxyXG4gICAgICAgICAgICBhbW91bnQ6IGV4cGVyaWVuY2VcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHRoaXMucGxheWVyLnNlbmQobmV3IE1lc3NhZ2VzLlByb2Zlc3Npb24oUGFja2V0cy5Qcm9mZXNzaW9uT3Bjb2RlLlVwZGF0ZSwge1xyXG4gICAgICAgICAgICBpZDogdGhpcy5pZCxcclxuICAgICAgICAgICAgbGV2ZWw6IHRoaXMubGV2ZWwsXHJcbiAgICAgICAgICAgIHBlcmNlbnRhZ2U6IHRoaXMuZ2V0UGVyY2VudGFnZSgpXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLnBsYXllci5zYXZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCgpIHtcclxuICAgICAgICByZXR1cm4gJ05vdCBpbXBsZW1lbnRlZC4nO1xyXG4gICAgfVxyXG5cclxuICAgIGdldExldmVsKCkge1xyXG4gICAgICAgIGxldCBsZXZlbCA9IEZvcm11bGFzLmV4cFRvTGV2ZWwodGhpcy5leHBlcmllbmNlKTtcclxuXHJcbiAgICAgICAgaWYgKGxldmVsID4gQ29uc3RhbnRzLk1BWF9QUk9GRVNTSU9OX0xFVkVMKVxyXG4gICAgICAgICAgICBsZXZlbCA9IENvbnN0YW50cy5NQVhfUFJPRkVTU0lPTl9MRVZFTDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGxldmVsO1xyXG4gICAgfVxyXG5cclxuICAgIHN5bmMoKSB7XHJcblxyXG4gICAgICAgIHRoaXMucGxheWVyLnNlbmRUb0FkamFjZW50UmVnaW9ucyh0aGlzLnBsYXllci5yZWdpb24sIG5ldyBNZXNzYWdlcy5TeW5jKHtcclxuICAgICAgICAgICAgaWQ6IHRoaXMucGxheWVyLmluc3RhbmNlLFxyXG4gICAgICAgICAgICBvcmllbnRhdGlvbjogdGhpcy5nZXRPcmllbnRhdGlvbigpXHJcbiAgICAgICAgfSkpXHJcbiAgICB9XHJcblxyXG4gICAgaXNUYXJnZXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGxheWVyLnRhcmdldCA9PT0gdGhpcy50YXJnZXRJZDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRQZXJjZW50YWdlKCkge1xyXG4gICAgICAgIGxldCBleHBlcmllbmNlID0gdGhpcy5leHBlcmllbmNlIC0gdGhpcy5wcmV2RXhwZXJpZW5jZSxcclxuICAgICAgICAgICAgbmV4dEV4cGVyaWVuY2UgPSB0aGlzLm5leHRFeHBlcmllbmNlIC0gdGhpcy5wcmV2RXhwZXJpZW5jZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChleHBlcmllbmNlIC8gbmV4dEV4cGVyaWVuY2UgKiAxMDApLnRvRml4ZWQoMik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0T3JpZW50YXRpb24oKSB7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy50YXJnZXRJZClcclxuICAgICAgICAgICAgcmV0dXJuIE1vZHVsZXMuT3JpZW50YXRpb24uVXA7XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbiA9IHRoaXMubWFwLmlkVG9Qb3NpdGlvbih0aGlzLnRhcmdldElkKTtcclxuXHJcbiAgICAgICAgaWYgKHBvc2l0aW9uLnggPiB0aGlzLnBsYXllci54KVxyXG4gICAgICAgICAgICByZXR1cm4gTW9kdWxlcy5PcmllbnRhdGlvbi5SaWdodDtcclxuICAgICAgICBlbHNlIGlmIChwb3NpdGlvbi54IDwgdGhpcy5wbGF5ZXIueClcclxuICAgICAgICAgICAgcmV0dXJuIE1vZHVsZXMuT3JpZW50YXRpb24uTGVmdDtcclxuICAgICAgICBlbHNlIGlmIChwb3NpdGlvbi55ID4gdGhpcy5wbGF5ZXIueSlcclxuICAgICAgICAgICAgcmV0dXJuIE1vZHVsZXMuT3JpZW50YXRpb24uRG93bjtcclxuICAgICAgICBlbHNlIChwb3NpdGlvbi55IDwgdGhpcy5wbGF5ZXIueSlcclxuICAgICAgICAgICAgcmV0dXJuIE1vZHVsZXMuT3JpZW50YXRpb24uVXA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RGF0YSgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBleHBlcmllbmNlOiB0aGlzLmV4cGVyaWVuY2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFByb2Zlc3Npb247XHJcbiJdLCJzb3VyY2VSb290IjoiIn0=