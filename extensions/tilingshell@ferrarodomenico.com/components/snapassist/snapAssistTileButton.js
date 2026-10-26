// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var registerGObjectClass = Me.imports.utils.gjs.registerGObjectClass;
var St = Me.imports.gi.ext.St;
var SnapAssistTile = Me.imports.components.snapassist.snapAssistTile.SnapAssistTile;
var _SnapAssistTileButton = class _SnapAssistTileButton extends SnapAssistTile {
  _btn;
  constructor(params) {
    super(params);
    this._btn = new St.Button({
      xExpand: true,
      yExpand: true,
      trackHover: true
    });
    this.add_child(this._btn);
    this._btn.set_size(this.innerWidth, this.innerHeight);
    this._btn.connect(
      "notify::hover",
      () => this.set_hover(this._btn.hover)
    );
  }

  get tile() {
    return this._tile;
  }

  get checked() {
    return this._btn.checked;
  }

  set_checked(newVal) {
    this._btn.set_checked(newVal);
  }

  connect(signal, callback) {
    if (signal === "clicked") return this._btn.connect(signal, callback);
    return super.connect(signal, callback);
  }
};
registerGObjectClass(_SnapAssistTileButton);
var SnapAssistTileButton = _SnapAssistTileButton;