// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var registerGObjectClass = Me.imports.utils.gjs.registerGObjectClass;
var Clutter = Me.imports.gi.ext.Clutter;
var St = Me.imports.gi.ext.St;
var LayoutWidget = Me.imports.components.layout.LayoutWidget.LayoutWidget;
var Layout = Me.imports.components.layout.Layout.Layout;
var buildMarginOf = Me.imports.utils.ui.buildMarginOf;
var buildRectangle = Me.imports.utils.ui.buildRectangle;
var TilePreviewWithWindow = Me.imports.components.altTab.tilePreviewWithWindow.TilePreviewWithWindow;
var MetaWindowGroup = Me.imports.components.altTab.MetaWindowGroup.MetaWindowGroup;
var _ = Me.imports.translations._;
var OUTER_GAPS = 2;
var _MultipleWindowsIcon = class _MultipleWindowsIcon extends LayoutWidget {
  _label;
  _window;
  constructor(params) {
    super({
      layout: new Layout(params.tiles, ""),
      innerGaps: params.innerGaps.copy(),
      outerGaps: buildMarginOf(OUTER_GAPS)
    });
    this.set_size(params.width, params.height);
    super.relayout({
      containerRect: buildRectangle({
        x: 0,
        y: 0,
        width: params.width,
        height: params.height
      })
    });
    this._previews.forEach((preview, index) => {
      const window = params.windows[index];
      if (!window) {
        preview.hide();
        return;
      }
      const winClone = new Clutter.Clone({
        source: window.get_compositor_private(),
        width: preview.innerWidth,
        height: preview.innerHeight
      });
      preview.add_child(winClone);
    });
    this._label = new St.Label({
      text: _("Tiled windows")
    });
    this._window = new MetaWindowGroup(params.windows);
    this.connect("destroy", () => this._window.destroy());
    let rightMostPercentage = 0;
    params.tiles.forEach((t) => {
      if (t.x + t.width > rightMostPercentage)
      rightMostPercentage = t.x + t.width;
    });
    this.set_width(params.width * rightMostPercentage);
  }

  buildTile(parent, rect, gaps, tile) {
    return new TilePreviewWithWindow({ parent, rect, gaps, tile });
  }

  get window() {
    return this._window;
  }

  get label() {
    return this._label;
  }
};
registerGObjectClass(_MultipleWindowsIcon);
var MultipleWindowsIcon = _MultipleWindowsIcon;