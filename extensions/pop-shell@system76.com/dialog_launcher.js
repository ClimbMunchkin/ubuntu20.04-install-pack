const Me = imports.misc.extensionUtils.getCurrentExtension();
const { Clutter, GLib, Meta, St } = imports.gi;
const app_info = Me.imports.app_info;
const error = Me.imports.error;
const lib = Me.imports.lib;
const log = Me.imports.log;
const result = Me.imports.result;
const search = Me.imports.dialog_search;
const window = Me.imports.window;
const launchers = Me.imports.launcherext;
const widgets = Me.imports.widgets;
const { OK } = result;
const HOME_DIR = GLib.get_home_dir();
const SEARCH_PATHS = [
    ["System", "/usr/share/applications/"],
    ["System-Local", "/usr/local/share/applications/"],
    ["Local", HOME_DIR + "/.local/share/applications/"],
    ["Flatpak (system)", "/var/lib/flatpak/exports/share/applications/"],
    ["Flatpak", HOME_DIR + "/.local/share/flatpak/exports/share/applications/"],
    ["Snap (system)", "/var/lib/snapd/desktop/applications/"]
];
const MODES = [
    new launchers.TerminalLauncher(),
    new launchers.CommandLauncher(),
    new launchers.CalcLauncher(),
    new launchers.RecentDocumentLauncher(),
];
var Launcher = class Launcher extends search.Search {
    constructor(ext) {
        let apps = new Array();
        let cancel = () => {
            ext.overlay.visible = false;
        };
        let mode = (id) => {
            ext.overlay.visible = false;
            this.mode = id;
        };
        let search = (pattern) => {
            var _a, _b;
            this.selections.splice(0);
            this.active.splice(0);
            apps.splice(0);
            if (this.mode !== -1) {
                const launcher = MODES[this.mode].init(ext, this);
                const results = (_b = (_a = launcher.search_results) === null || _a === void 0 ? void 0 : _a.call(launcher, pattern.slice(launcher.prefix.length).trim())) !== null && _b !== void 0 ? _b : null;
                results === null || results === void 0 ? void 0 : results.forEach(button => this.active.push(button));
                return this.active;
            }
            if (pattern.length == 0) {
                this.list_workspace(ext);
                return this.active;
            }
            const needles = pattern.split(' ');
            const contains_pattern = (haystack, needles) => {
                const hay = haystack.toLowerCase();
                return needles.every((n) => hay.includes(n));
            };
            for (const window of ext.tab_list(Meta.TabList.NORMAL, null)) {
                const retain = contains_pattern(window.name(ext), needles)
                    || contains_pattern(window.meta.get_title(), needles);
                if (retain) {
                    this.selections.push(window);
                }
            }
            for (const [where, info] of this.desktop_apps) {
                const retain = contains_pattern(info.name(), needles)
                    || contains_pattern(info.desktop_name, needles)
                    || lib.ok(info.generic_name(), (s) => contains_pattern(s, needles))
                    || lib.ok(info.comment(), (s) => contains_pattern(s, needles))
                    || lib.ok(info.categories(), (s) => contains_pattern(s, needles));
                if (retain) {
                    this.selections.push([where, info]);
                }
            }
            this.selections.sort((a, b) => {
                const a_name = a instanceof window.ShellWindow ? a.name(ext) : a[1].name();
                const b_name = b instanceof window.ShellWindow ? b.name(ext) : b[1].name();
                return a_name.toLowerCase() > b_name.toLowerCase() ? 1 : 0;
            });
            this.selections.splice(this.list_max());
            for (const selection of this.selections) {
                let data;
                if (selection instanceof window.ShellWindow) {
                    data = window_selection(ext, selection, this.icon_size());
                }
                else {
                    const [where, app] = selection;
                    const generic = app.generic_name();
                    data = widgets.application_button(generic ? `${generic} (${app.name()}) [${where}]` : `${app.name()} [${where}]`, new St.Icon({
                        icon_name: 'application-default-symbolic',
                        icon_size: this.icon_size() / 2,
                        style_class: "pop-shell-search-cat"
                    }), new St.Icon({
                        gicon: app.icon(),
                        icon_size: this.icon_size(),
                    }));
                }
                this.active.push(data);
            }
            return this.active;
        };
        let select = (id) => {
            ext.overlay.visible = false;
            if (id >= this.selections.length)
                return;
            const selected = this.selections[id];
            if (selected && selected instanceof window.ShellWindow) {
                if (selected.workspace_id() == ext.active_workspace()) {
                    const rect = selected.rect();
                    ext.overlay.x = rect.x;
                    ext.overlay.y = rect.y;
                    ext.overlay.width = rect.width;
                    ext.overlay.height = rect.height;
                    ext.overlay.visible = true;
                }
            }
        };
        let apply = (text, index) => {
            ext.overlay.visible = false;
            if (this.mode === -1) {
                const selected = this.selections[index];
                if (selected instanceof window.ShellWindow) {
                    selected.activate();
                }
                else {
                    const result = selected[1].launch();
                    if (result instanceof error.Error) {
                        log.error(result.format());
                    }
                    else {
                        let exec_name = selected[1].app_info.get_executable();
                        if (exec_name === "gnome-control-center") {
                            for (const window of ext.tab_list(Meta.TabList.NORMAL, null)) {
                                if (window.meta.get_title() === "Settings") {
                                    window.meta.activate(global.get_current_time());
                                    break;
                                }
                            }
                        }
                    }
                }
                return false;
            }
            const launcher = MODES[this.mode].init(ext, this);
            return launcher.apply(text.slice(launcher.prefix.length).trim(), index);
        };
        super(MODES.map(mode => mode.prefix), cancel, search, select, apply, mode);
        this.dialog.dialogLayout._dialog.y_align = Clutter.ActorAlign.START;
        this.dialog.dialogLayout._dialog.x_align = Clutter.ActorAlign.START;
        this.dialog.dialogLayout.y = 48;
        this.selections = new Array();
        this.active = new Array();
        this.desktop_apps = new Array();
        this.mode = -1;
    }
    load_desktop_files() {
        lib.bench("load_desktop_files", () => {
            this.desktop_apps.splice(0);
            for (const [where, path] of SEARCH_PATHS) {
                for (const result of app_info.load_desktop_entries(path)) {
                    if (result.kind == OK) {
                        const value = result.value;
                        this.desktop_apps.push([where, value]);
                    }
                    else {
                        const why = result.value;
                        log.warn(why.context(`failed to load desktop app`).format());
                    }
                }
            }
        });
    }
    list_workspace(ext) {
        let show_all_workspaces = true;
        const active = ext.active_workspace();
        for (const window of ext.tab_list(Meta.TabList.NORMAL, null)) {
            if (show_all_workspaces || window.workspace_id() === active) {
                this.selections.push(window);
                this.active.push(window_selection(ext, window, this.icon_size()));
                if (this.selections.length == this.list_max())
                    break;
            }
        }
    }
    open(ext) {
        const mon = ext.monitor_work_area(ext.active_monitor());
        this.active.splice(0);
        this.selections.splice(0);
        this.clear();
        this.dialog.dialogLayout.x = (mon.width / 2) - (this.dialog.dialogLayout.width / 2);
        this.dialog.dialogLayout.y = (mon.height / 2) - (this.dialog.dialogLayout.height);
        this.list_workspace(ext);
        this.update_search_list(this.active);
        this.dialog.open(global.get_current_time(), false);
    }
}
function window_selection(ext, window, icon_size) {
    let name = window.name(ext);
    let title = window.meta.get_title();
    if (name != title) {
        name += ': ' + title;
    }
    return widgets.application_button(name, new St.Icon({
        icon_name: 'focus-windows-symbolic',
        icon_size: icon_size / 2,
        style_class: "pop-shell-search-cat"
    }), window.icon(ext, icon_size));
}
//# sourceMappingURL=dialog_launcher.js.map