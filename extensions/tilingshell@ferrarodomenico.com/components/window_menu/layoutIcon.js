// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var Layout = Me.imports.components.layout.Layout.Layout;
var LayoutWidget = Me.imports.components.layout.LayoutWidget.LayoutWidget;
var SnapAssistTile = Me.imports.components.snapassist.snapAssistTile.SnapAssistTile;
var registerGObjectClass = Me.imports.utils.gjs.registerGObjectClass;
var buildRectangle = Me.imports.utils.ui.buildRectangle;
var getScalingFactorOf = Me.imports.utils.ui.getScalingFactorOf;
var _LayoutIcon = class _LayoutIcon extends LayoutWidget {
  constructor(parent, importantTiles, tiles, innerGaps, outerGaps, width, height) {
    super({
      parent,
      layout: new Layout(tiles, ""),
      innerGaps: innerGaps.copy(),
      outerGaps: outerGaps.copy(),
      containerRect: buildRectangle(),
      styleClass: "layout-icon button"
    });
    const [, scalingFactor] = getScalingFactorOf(this);
    width *= scalingFactor;
    height *= scalingFactor;
    super.relayout({
      containerRect: buildRectangle({ x: 0, y: 0, width, height })
    });
    this.set_size(width, height);
    this.set_x_expand(false);
    this.set_y_expand(false);
    importantTiles.forEach((t) => {
      const preview = this._previews.find(
        (snap) => snap.tile.x === t.x && snap.tile.y === t.y
      );
      if (preview) preview.add_style_class_name("important");
    });
  }

  buildTile(parent, rect, gaps, tile) {
    return new SnapAssistTile({ parent, rect, gaps, tile });
  }
};
registerGObjectClass(_LayoutIcon);
var LayoutIcon = _LayoutIcon;