'use strict';
define(function(require, exports, module) {
    var Event = {
        tap: function(element, callback) {
            if (!element) return console.error("tap瀵硅薄涓嶈兘涓虹┖");
            element.__tap = {};
            element.__tap.event = {
                start: function(e) {
                    e.stopPropagation();
                    element.__tap.clickabled = true;
                    element.__tap.starttime = e.timeStamp;
                    element.__tap.startPageX = e.changedTouches[0].pageX;
                    element.__tap.startPageY = e.changedTouches[0].pageY;
                },
                move: function(e) {
                    if (Math.abs(e.changedTouches[0].pageX - element.__tap.startPageX) >= 5 ||
                        Math.abs(e.changedTouches[0].pageY - element.__tap.startPageY) >= 5) {
                        element.__tap.clickabled = false;
                    }
                },
                end: function(e) {
                    var _this = this;
                    e.stopPropagation();
                    if (e.timeStamp - element.__tap.starttime > 30 &&
                        e.timeStamp - element.__tap.starttime < 300 &&
                        element.__tap.clickabled) {
                        // 瀹氭椂鍣ㄧ敤浜庢彁浜よ〃鍗曟椂锛宨nput鐒︾偣鑾峰彇澶辨晥
                        setTimeout(function() {
                            if ( !! callback) {
                                callback.call(_this, arguments);
                            }
                        }, 10);
                    }
                },
                click: function(e) {
                    e.stopPropagation();
                    callback && callback.call(this, arguments);
                }
            }
            if ( !! navigator.userAgent.match(/AppleWebKit.*Mobile.*/)) {
                element.addEventListener('touchstart', element.__tap.event.start, false);
                element.addEventListener('touchmove', element.__tap.event.move, false);
                element.addEventListener('touchend', element.__tap.event.end, false);
            } else {
                element.addEventListener('click', element.__tap.event.click, false);
            }
            return element;
        },
        untap: function(element) {
            if (!element) return console.error("untap瀵硅薄涓嶈兘涓虹┖");
            element.__tap = element.__tap || {};
            if ( !! navigator.userAgent.match(/AppleWebKit.*Mobile.*/) && !! element.__tap.event) {
                element.__tap.event.start && element.removeEventListener('touchstart', element.__tap.event.start, false);
                element.__tap.event.move && element.removeEventListener('touchmove', element.__tap.event.move, false);
                element.__tap.event.end && element.removeEventListener('touchend', element.__tap.event.end, false);
            } else if ( !! element.__tap.event) {
                element.__tap.event.click && element.removeEventListener('click', element.__tap.event.click, false);
            }
            return element;
        },
        taps: function(elements, callback) {
            for (var i = 0; i < elements.length; i++) {
                Event.tap(elements[i], callback);
            }
        }
    };
    window.__tap__ = Event.tap;
    window.__taps__ = Event.taps;
    window.__untap__ = Event.untap;
    module.exports = Event;
});