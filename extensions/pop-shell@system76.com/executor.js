var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var _event_loop, _events;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const GLib = imports.gi.GLib;
var GLibExecutor = class GLibExecutor {
    constructor() {
        _event_loop.set(this, null);
        _events.set(this, new Array());
    }
    wake(system, event) {
        __classPrivateFieldGet(this, _events).unshift(event);
        if (__classPrivateFieldGet(this, _event_loop))
            return;
        __classPrivateFieldSet(this, _event_loop, GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            let event = __classPrivateFieldGet(this, _events).pop();
            if (event)
                system.run(event);
            if (__classPrivateFieldGet(this, _events).length === 0) {
                __classPrivateFieldSet(this, _event_loop, null);
                return false;
            }
            return true;
        }));
    }
}
_event_loop = new WeakMap(), _events = new WeakMap();
//# sourceMappingURL=executor.js.map