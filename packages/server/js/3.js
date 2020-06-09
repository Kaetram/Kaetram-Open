(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[3],{

/***/ "../data/items/healthFlask.ts":
/*!************************************!*\
  !*** ../data/items/healthFlask.ts ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _ts_util_items__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../ts/util/items */ "./util/items.ts");
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* global module */


class HealthFlask {
  constructor(id) {
    _defineProperty(this, "id", void 0);

    _defineProperty(this, "healAmount", void 0);

    _defineProperty(this, "manaAmount", void 0);

    var self = this;
    self.id = id;
    self.healAmount = 0;
    self.manaAmount = 0;
    var customData = _ts_util_items__WEBPACK_IMPORTED_MODULE_0__["default"].getCustomData(self.id);

    if (customData) {
      self.healAmount = customData.healAmount ? customData.healAmount : 0;
      self.manaAmount = customData.manaAmount ? customData.manaAmount : 0;
    }
  }

  onUse(character) {
    var self = this;
    if (self.healAmount) character.healHitPoints(self.healAmount);
    if (self.manaAmount) character.healManaPoints(self.manaAmount);
  }

}

/* harmony default export */ __webpack_exports__["default"] = (HealthFlask);

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi4vZGF0YS9pdGVtcy9oZWFsdGhGbGFzay50cyJdLCJuYW1lcyI6WyJIZWFsdGhGbGFzayIsImNvbnN0cnVjdG9yIiwiaWQiLCJzZWxmIiwiaGVhbEFtb3VudCIsIm1hbmFBbW91bnQiLCJjdXN0b21EYXRhIiwiSXRlbXMiLCJnZXRDdXN0b21EYXRhIiwib25Vc2UiLCJjaGFyYWN0ZXIiLCJoZWFsSGl0UG9pbnRzIiwiaGVhbE1hbmFQb2ludHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQTs7QUFHQSxNQUFNQSxXQUFOLENBQWtCO0FBTWRDLGFBQVcsQ0FBQ0MsRUFBRCxFQUFLO0FBQUE7O0FBQUE7O0FBQUE7O0FBQ1osUUFBSUMsSUFBSSxHQUFHLElBQVg7QUFFQUEsUUFBSSxDQUFDRCxFQUFMLEdBQVVBLEVBQVY7QUFFQUMsUUFBSSxDQUFDQyxVQUFMLEdBQWtCLENBQWxCO0FBQ0FELFFBQUksQ0FBQ0UsVUFBTCxHQUFrQixDQUFsQjtBQUVBLFFBQUlDLFVBQVUsR0FBR0Msc0RBQUssQ0FBQ0MsYUFBTixDQUFvQkwsSUFBSSxDQUFDRCxFQUF6QixDQUFqQjs7QUFFQSxRQUFJSSxVQUFKLEVBQWdCO0FBQ1pILFVBQUksQ0FBQ0MsVUFBTCxHQUFrQkUsVUFBVSxDQUFDRixVQUFYLEdBQXdCRSxVQUFVLENBQUNGLFVBQW5DLEdBQWdELENBQWxFO0FBQ0FELFVBQUksQ0FBQ0UsVUFBTCxHQUFrQkMsVUFBVSxDQUFDRCxVQUFYLEdBQXdCQyxVQUFVLENBQUNELFVBQW5DLEdBQWdELENBQWxFO0FBQ0g7QUFFSjs7QUFFREksT0FBSyxDQUFDQyxTQUFELEVBQVk7QUFDYixRQUFJUCxJQUFJLEdBQUcsSUFBWDtBQUVBLFFBQUlBLElBQUksQ0FBQ0MsVUFBVCxFQUNJTSxTQUFTLENBQUNDLGFBQVYsQ0FBd0JSLElBQUksQ0FBQ0MsVUFBN0I7QUFFSixRQUFJRCxJQUFJLENBQUNFLFVBQVQsRUFDSUssU0FBUyxDQUFDRSxjQUFWLENBQXlCVCxJQUFJLENBQUNFLFVBQTlCO0FBRVA7O0FBaENhOztBQW9DSEwsMEVBQWYsRSIsImZpbGUiOiIzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIG1vZHVsZSAqL1xyXG5cclxuaW1wb3J0IEl0ZW1zIGZyb20gJy4uLy4uL3RzL3V0aWwvaXRlbXMnO1xyXG4gICAgaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uL3RzL3V0aWwvdXRpbHMnO1xyXG5cclxuY2xhc3MgSGVhbHRoRmxhc2sge1xyXG5cclxuICAgIGlkOiBudW1iZXI7XHJcbiAgICBoZWFsQW1vdW50OiBudW1iZXI7XHJcbiAgICBtYW5hQW1vdW50OiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaWQpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHNlbGYuaWQgPSBpZDtcclxuXHJcbiAgICAgICAgc2VsZi5oZWFsQW1vdW50ID0gMDtcclxuICAgICAgICBzZWxmLm1hbmFBbW91bnQgPSAwO1xyXG5cclxuICAgICAgICBsZXQgY3VzdG9tRGF0YSA9IEl0ZW1zLmdldEN1c3RvbURhdGEoc2VsZi5pZCk7XHJcblxyXG4gICAgICAgIGlmIChjdXN0b21EYXRhKSB7XHJcbiAgICAgICAgICAgIHNlbGYuaGVhbEFtb3VudCA9IGN1c3RvbURhdGEuaGVhbEFtb3VudCA/IGN1c3RvbURhdGEuaGVhbEFtb3VudCA6IDA7XHJcbiAgICAgICAgICAgIHNlbGYubWFuYUFtb3VudCA9IGN1c3RvbURhdGEubWFuYUFtb3VudCA/IGN1c3RvbURhdGEubWFuYUFtb3VudCA6IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvblVzZShjaGFyYWN0ZXIpIHtcclxuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChzZWxmLmhlYWxBbW91bnQpXHJcbiAgICAgICAgICAgIGNoYXJhY3Rlci5oZWFsSGl0UG9pbnRzKHNlbGYuaGVhbEFtb3VudCk7XHJcblxyXG4gICAgICAgIGlmIChzZWxmLm1hbmFBbW91bnQpXHJcbiAgICAgICAgICAgIGNoYXJhY3Rlci5oZWFsTWFuYVBvaW50cyhzZWxmLm1hbmFBbW91bnQpO1xyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEhlYWx0aEZsYXNrO1xyXG4iXSwic291cmNlUm9vdCI6IiJ9