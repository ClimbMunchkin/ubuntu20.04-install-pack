// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var St = Me.imports.gi.ext.St;
var Clutter = Me.imports.gi.ext.Clutter;
var Shell = Me.imports.gi.ext.Shell;
var Gio = Me.imports.gi.ext.Gio;
var Main = imports.ui.main;
var PanelMenu = imports.ui.panelMenu;
var Settings = Me.imports.settings.settings.Settings;
var Layout = Me.imports.components.layout.Layout.Layout;
var Tile = Me.imports.components.layout.Tile.Tile;
var LayoutEditor = Me.imports.components.editor.layoutEditor.LayoutEditor;
var DefaultMenu = Me.imports.indicator.defaultMenu.DefaultMenu;
var GlobalState = Me.imports.utils.globalState.GlobalState;
var EditingMenu = Me.imports.indicator.editingMenu.EditingMenu;
var EditorDialog = Me.imports.components.editor.editorDialog.EditorDialog;
var registerGObjectClass = Me.imports.utils.gjs.registerGObjectClass;
var IndicatorState = /* @__PURE__ */((IndicatorState2) => {
  IndicatorState2[IndicatorState2["DEFAULT"] = 1] = "DEFAULT";
  IndicatorState2[IndicatorState2["CREATE_NEW"] = 2] = "CREATE_NEW";
  IndicatorState2[IndicatorState2["EDITING_LAYOUT"] = 3] = "EDITING_LAYOUT";
  return IndicatorState2;
})(IndicatorState || {});
var _Indicator = class _Indicator extends PanelMenu.Button {
  _layoutEditor;
  _editorDialog;
  _currentMenu;
  _state;
  _enableScaling;
  _path;
  _keyPressEvent;
  constructor(path, uuid) {
    super(0.5, "Tiling Shell Indicator", false);
    Main.panel.addToStatusArea(uuid, this, 1, "right");
    Settings.bind(
      Settings.KEY_SHOW_INDICATOR,
      this,
      "visible",
      Gio.SettingsBindFlags.GET
    );
    const icon = new St.Icon({
      gicon: Gio.icon_new_for_string(
        `${path}/icons/indicator-symbolic.svg`
      ),
      styleClass: "system-status-icon indicator-icon"
    });
    this.add_child(icon);
    this._layoutEditor = null;
    this._editorDialog = null;
    this._currentMenu = null;
    this._state = 1 /* DEFAULT */;
    this._keyPressEvent = null;
    this._enableScaling = false;
    this._path = path;
    this.connect("destroy", this._onDestroy.bind(this));
  }

  get path() {
    return this._path;
  }

  set enableScaling(value) {
    if (this._enableScaling === value) return;
    this._enableScaling = value;
    if (this._currentMenu && this._state === 1 /* DEFAULT */) {
      this._currentMenu.destroy();
      this._currentMenu = new DefaultMenu(this, this._enableScaling, this._openPreferences.bind(this));
    }
  }

  enable() {
    this.menu.removeAll();
    this._currentMenu = new DefaultMenu(this, this._enableScaling, this._openPreferences.bind(this));
  }

  selectLayoutOnClick(monitorIndex, layoutToSelectId) {
    GlobalState.get().setSelectedLayoutOfMonitor(
      layoutToSelectId,
      monitorIndex
    );
    this.menu.toggle();
  }

  newLayoutOnClick(showLegendOnly) {
    this.menu.close(true);
    const newLayout = new Layout(
      [
      new Tile({ x: 0, y: 0, width: 0.3, height: 1, groups: [1] }),
      new Tile({ x: 0.3, y: 0, width: 0.7, height: 1, groups: [1] })],

      `${Shell.Global.get().get_current_time()}`
    );
    if (this._layoutEditor) {
      this._layoutEditor.layout = newLayout;
    } else {
      this._layoutEditor = new LayoutEditor(
        newLayout,
        Main.layoutManager.monitors[Main.layoutManager.primaryIndex],
        this._enableScaling
      );
    }
    this._setState(2 /* CREATE_NEW */);
    if (showLegendOnly) this.openMenu(true);
  }

  openMenu(showLegend) {
    if (this._editorDialog) return;
    this._editorDialog = new EditorDialog({
      enableScaling: this._enableScaling,
      onNewLayout: () => {
        this.newLayoutOnClick(false);
      },
      onDeleteLayout: (ind, lay) => {
        GlobalState.get().deleteLayout(lay);
        if (this._layoutEditor && this._layoutEditor.layout.id === lay.id)
        this.cancelLayoutOnClick();
      },
      onSelectLayout: (ind, lay) => {
        const layCopy = new Layout(
          lay.tiles.map(
            (t) => new Tile({
              x: t.x,
              y: t.y,
              width: t.width,
              height: t.height,
              groups: [...t.groups]
            })
          ),
          lay.id
        );
        if (this._layoutEditor) {
          this._layoutEditor.layout = layCopy;
        } else {
          this._layoutEditor = new LayoutEditor(
            layCopy,
            Main.layoutManager.monitors[Main.layoutManager.primaryIndex],
            this._enableScaling
          );
        }
        this._setState(3 /* EDITING_LAYOUT */);
      },
      onClose: () => {
        this._editorDialog?.destroy();
        this._editorDialog = null;
      },
      onReorderLayout: (fromIndex, toIndex) => {
        GlobalState.get().swapLayouts(fromIndex, toIndex);
      },
      path: this._path,
      legend: showLegend
    });
    this._editorDialog.open();
  }

  openLayoutEditor() {
    this.openMenu(false);
  }

  saveLayoutOnClick() {
    if (this._layoutEditor === null || this._state === 1 /* DEFAULT */)
    return;
    const newLayout = this._layoutEditor.layout;
    if (this._state === 2 /* CREATE_NEW */)
    GlobalState.get().addLayout(newLayout);else
    GlobalState.get().editLayout(newLayout);
    this.menu.toggle();
    this._layoutEditor.destroy();
    this._layoutEditor = null;
    this._setState(1 /* DEFAULT */);
  }

  cancelLayoutOnClick() {
    if (this._layoutEditor === null || this._state === 1 /* DEFAULT */)
    return;
    this.menu.toggle();
    this._layoutEditor.destroy();
    this._layoutEditor = null;
    this._setState(1 /* DEFAULT */);
  }

  _openPreferences() {
    this.emit("open-preferences");
  }

  _setState(newState) {
    if (this._state === newState) return;
    this._state = newState;
    this._currentMenu?.destroy();
    switch (newState) {
      case 1 /* DEFAULT */:
        this._currentMenu = new DefaultMenu(this, this._enableScaling, this._openPreferences.bind(this));
        if (!Settings.SHOW_INDICATOR) this.hide();
        if (this._keyPressEvent) {
          global.stage.disconnect(this._keyPressEvent);
          this._keyPressEvent = null;
        }
        break;
      case 2 /* CREATE_NEW */:
      case 3 /* EDITING_LAYOUT */:
        if (this._keyPressEvent)
        global.stage.disconnect(this._keyPressEvent);
        this._keyPressEvent = global.stage.connect_after(
          "key-press-event",
          (_, event) => {
            const symbol = event.get_key_symbol();
            if (symbol === Clutter.KEY_Escape)
            this.cancelLayoutOnClick();
            return Clutter.EVENT_PROPAGATE;
          }
        );
        this._currentMenu = new EditingMenu(this);
        this.show();
        break;
    }
  }

  _onDestroy() {
    this._editorDialog?.destroy();
    this._editorDialog = null;
    this._layoutEditor?.destroy();
    this._layoutEditor = null;
    this._currentMenu?.destroy();
    this._currentMenu = null;
    this.menu.removeAll();
  }
};
registerGObjectClass(_Indicator, {
  Signals: {
    "open-preferences": {
      param_types: []
    }
  },
  GTypeName: "Indicator"
});
var Indicator = _Indicator;