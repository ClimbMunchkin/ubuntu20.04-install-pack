// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var Gio = Me.imports.gi.shared.Gio;
var GLib = Me.imports.gi.shared.GLib;
var GObject = Me.imports.gi.shared.GObject;
var Clutter = imports.gi.Clutter;
var Meta = imports.gi.Meta;
// For GNOME Shell version before 45
var Mtk = class { Rectangle }
Mtk.Rectangle = function (params = {}) {
    return new imports.gi.Meta.Rectangle(params);
};
Mtk.Rectangle.$gtype = imports.gi.Meta.Rectangle.$gtype;

var Shell = imports.gi.Shell;
var St = imports.gi.St;
var Graphene = imports.gi.Graphene;
var Atk = imports.gi.Atk;
var Pango = imports.gi.Pango;