// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var GObject = Me.imports.gi.ext.GObject;

function registerGObjectClass(target, metaInfo = {}) {
  if (!metaInfo.GTypeName) {
    metaInfo.GTypeName = `TilingShell${target.name}`;
  }
  return GObject.registerClass(metaInfo, target);
}