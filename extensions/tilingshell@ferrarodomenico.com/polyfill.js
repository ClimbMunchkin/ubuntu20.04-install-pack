// For GNOME Shell version before 45
var Extension = class {
    constructor(meta) { // meta has type ExtensionMeta
      this.metadata = meta.metadata;
      this.uuid = meta.uuid;
      this.path = meta.path;
    }
    getSettings() {
        return imports.misc.extensionUtils.getSettings();
    }

    openPreferences() {
        return imports.misc.extensionUtils.openPrefs();
    }
}


function openPrefs(ext) {
  if (Extension.openPrefs) {
    Extension.openPrefs();
  } else {
    ext.openPreferences();
  }
}