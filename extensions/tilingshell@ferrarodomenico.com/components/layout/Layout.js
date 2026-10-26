// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var Layout = class Layout {
  id;
  tiles;
  constructor(tiles, id) {
    this.tiles = tiles;
    this.id = id;
  }
};