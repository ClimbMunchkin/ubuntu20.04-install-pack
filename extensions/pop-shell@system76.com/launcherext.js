const Me = imports.misc.extensionUtils.getCurrentExtension();
const { evaluate } = Me.imports.math.math;
const { spawnCommandLine } = imports.misc.util;
const { GLib, Gtk, St } = imports.gi;
const log = Me.imports.log;
const once_cell = Me.imports.once_cell;
const widgets = Me.imports.widgets;
const DEFAULT_ICON_SIZE = 34;
const TERMINAL = new once_cell.OnceCell();
var CalcLauncher = class CalcLauncher {
    constructor() {
        this.prefix = '=';
        this.name = 'calc';
    }
    init(ext, search) {
        this.ext = ext;
        this.search = search;
        return this;
    }
    apply(expr) {
        var _a;
        const value = evaluate(expr).toString();
        if (!this.search) {
            log.error("init was never called");
        }
        (_a = this.search) === null || _a === void 0 ? void 0 : _a.set_text(`=${value}`);
        return true;
    }
    search_results(expr) {
        var _a, _b;
        if (expr.length === 0)
            return null;
        let out;
        try {
            out = '= ' + evaluate(expr).toString();
        }
        catch (e) {
            out = expr + ' x = ?';
        }
        const icon_size = (_b = (_a = this.search) === null || _a === void 0 ? void 0 : _a.icon_size()) !== null && _b !== void 0 ? _b : DEFAULT_ICON_SIZE;
        return [
            widgets.application_button(out, new St.Icon({
                icon_name: 'x-office-spreadsheet',
                icon_size: icon_size / 2,
                style_class: "pop-shell-search-cat"
            }), new St.Icon({
                icon_name: 'accessories-calculator',
                icon_size: icon_size
            }))
        ];
    }
}
var CommandLauncher = class CommandLauncher {
    constructor() {
        this.prefix = ':';
        this.name = 'command';
    }
    init() {
        return this;
    }
    apply(cmd) {
        spawnCommandLine(cmd);
        return false;
    }
}
var RecentDocumentLauncher = class RecentDocumentLauncher {
    constructor() {
        this.prefix = 'd:';
        this.name = 'recent docs';
        this.recent_manager = Gtk.RecentManager.get_default();
    }
    init(_, search) {
        this.search = search;
        return this;
    }
    apply(_, index) {
        if (!this.results) {
            return false;
        }
        const uri = this.results[index].uri;
        const cmd = `xdg-open ${uri}`;
        spawnCommandLine(cmd);
        return false;
    }
    items() {
        const recent_items = this.recent_manager.get_items();
        if (!recent_items) {
            return undefined;
        }
        const items = recent_items.filter((item) => item.exists()).map((item) => {
            return {
                display_name: item.get_display_name(),
                icon: item.get_gicon(),
                uri: item.get_uri()
            };
        });
        return items;
    }
    search_results(query) {
        const items = this.items();
        if (!items) {
            return null;
        }
        if (!this.search) {
            log.error('init not called before performing search');
            return null;
        }
        const normalized_query = query.toLowerCase();
        this.results = items.filter(item => item.display_name.toLowerCase().includes(normalized_query) || item.uri.toLowerCase().includes(normalized_query)).slice(0, this.search.list_max()).sort((a, b) => a.display_name.localeCompare(b.display_name));
        return this.results.map((item) => {
            var _a, _b, _c, _d;
            return widgets.application_button(`${item.display_name}: ${decodeURI(item.uri)}`, new St.Icon({
                icon_name: 'system-file-manager',
                icon_size: ((_b = (_a = this.search) === null || _a === void 0 ? void 0 : _a.icon_size()) !== null && _b !== void 0 ? _b : DEFAULT_ICON_SIZE) / 2,
                style_class: "pop-shell-search-cat"
            }), new St.Icon({
                gicon: item.icon,
                icon_size: (_d = (_c = this.search) === null || _c === void 0 ? void 0 : _c.icon_size()) !== null && _d !== void 0 ? _d : DEFAULT_ICON_SIZE
            }));
        });
    }
}
var TerminalLauncher = class TerminalLauncher {
    constructor() {
        this.prefix = 't:';
        this.name = 'terminal';
    }
    init() {
        return this;
    }
    apply(cmd) {
        let [terminal, splitter] = TERMINAL.get_or_init(() => {
            let path = GLib.find_program_in_path('x-terminal-emulator');
            return path ? [path, "-e"] : ["gnome-terminal", "--"];
        });
        spawnCommandLine(`${terminal} ${splitter} sh -c '${cmd}; echo "Press to exit"; read t'`);
        return false;
    }
}
//# sourceMappingURL=launcherext.js.map