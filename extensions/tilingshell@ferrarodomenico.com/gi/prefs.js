// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
class ExtensionPreferences {
    constructor(metadata, path) {
        this.metadata = metadata;
        this.path = path;
    }

    getSettings() {
        return imports.misc.extensionUtils.getSettings();
    }
}
var Gio = Me.imports.gi.shared.Gio;
var GLib = Me.imports.gi.shared.GLib;
var GObject = Me.imports.gi.shared.GObject;
var Gdk = imports.gi.Gdk;
var Gtk = imports.gi.Gtk;
var Adw = imports.gi.Adw;// For GNOME Shell version before 45
function init() {
    imports.misc.extensionUtils.initTranslations();
}

function fillPreferencesWindow(window) {
    const metadata = imports.misc.extensionUtils.getCurrentExtension().metadata;
    const prefs = new TilingShellExtensionPreferences(metadata, Me.dir.get_path());
    prefs.fillPreferencesWindow(window);
}
