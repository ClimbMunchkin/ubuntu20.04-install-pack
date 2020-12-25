const Me = imports.misc.extensionUtils.getCurrentExtension();
const { wm } = imports.ui.main;
const { Meta, Shell } = imports.gi;
var Keybindings = class Keybindings {
    constructor(ext) {
        this.ext = ext;
        this.global = {
            "activate-launcher": () => {
                ext.tiler.exit(ext);
                ext.window_search.load_desktop_files();
                ext.window_search.open(ext);
            },
            "tile-enter": () => ext.tiler.enter(ext)
        };
        this.window_focus = {
            "focus-left": () => {
                this.stack_select(ext, (id, stack) => id === 0 ? null : stack.tabs[id - 1].entity, () => ext.activate_window(ext.focus_selector.left(ext, null)));
            },
            "focus-down": () => ext.activate_window(ext.focus_selector.down(ext, null)),
            "focus-up": () => ext.activate_window(ext.focus_selector.up(ext, null)),
            "focus-right": () => {
                this.stack_select(ext, (id, stack) => stack.tabs.length > id + 1 ? stack.tabs[id + 1].entity : null, () => ext.activate_window(ext.focus_selector.right(ext, null)));
            },
            "tile-orientation": () => {
                var _a;
                const win = ext.focus_window();
                if (win)
                    (_a = ext.auto_tiler) === null || _a === void 0 ? void 0 : _a.toggle_orientation(ext, win);
            },
            "toggle-floating": () => { var _a; return (_a = ext.auto_tiler) === null || _a === void 0 ? void 0 : _a.toggle_floating(ext); },
            "toggle-tiling": () => ext.toggle_tiling(),
            "toggle-stacking-global": () => { var _a; return (_a = ext.auto_tiler) === null || _a === void 0 ? void 0 : _a.toggle_stacking(ext); },
            "pop-monitor-left": () => ext.move_monitor(Meta.DisplayDirection.LEFT),
            "pop-monitor-right": () => ext.move_monitor(Meta.DisplayDirection.RIGHT),
            "pop-monitor-up": () => ext.move_monitor(Meta.DisplayDirection.UP),
            "pop-monitor-down": () => ext.move_monitor(Meta.DisplayDirection.DOWN),
            "pop-workspace-up": () => ext.move_workspace(Meta.DisplayDirection.UP),
            "pop-workspace-down": () => ext.move_workspace(Meta.DisplayDirection.DOWN)
        };
    }
    stack_select(ext, select, focus_shift) {
        const switched = this.stack_switch(ext, (stack) => {
            var _a;
            if (!stack)
                return false;
            const stack_con = (_a = ext.auto_tiler) === null || _a === void 0 ? void 0 : _a.forest.stacks.get(stack.idx);
            if (stack_con) {
                const id = stack_con.active_id;
                if (id !== -1) {
                    const next = select(id, stack_con);
                    if (next) {
                        stack_con.activate(next);
                        const window = ext.windows.get(next);
                        if (window) {
                            window.activate();
                            return true;
                        }
                    }
                }
            }
            return false;
        });
        if (!switched) {
            focus_shift();
        }
    }
    stack_switch(ext, apply) {
        const window = ext.focus_window();
        if (window) {
            if (ext.auto_tiler) {
                const node = ext.auto_tiler.find_stack(window.entity);
                return node ? apply(node[1].inner) : false;
            }
        }
    }
    enable(keybindings) {
        for (const name in keybindings) {
            wm.addKeybinding(name, this.ext.settings.ext, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, keybindings[name]);
        }
        return this;
    }
    disable(keybindings) {
        for (const name in keybindings) {
            wm.removeKeybinding(name);
        }
        return this;
    }
}
//# sourceMappingURL=keybindings.js.map