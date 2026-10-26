// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var GObject = Me.imports.gi.shared.GObject;

var Tile = class Tile {
  static $gtype = GObject.TYPE_JSOBJECT;
  x;
  y;
  width;
  height;
  groups;
  constructor({
    x,
    y,
    width,
    height,
    groups
  }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.groups = groups;
  }
};