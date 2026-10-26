// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var St = Me.imports.gi.ext.St;
var Clutter = Me.imports.gi.ext.Clutter;
var LayoutWidget = Me.imports.components.layout.LayoutWidget.LayoutWidget;
var SnapAssistTile = Me.imports.components.snapassist.snapAssistTile.SnapAssistTile;
var buildMarginOf = Me.imports.utils.ui.buildMarginOf;
var buildRectangle = Me.imports.utils.ui.buildRectangle;
var getScalingFactorOf = Me.imports.utils.ui.getScalingFactorOf;
var registerGObjectClass = Me.imports.utils.gjs.registerGObjectClass;
var _LayoutButtonWidget = class _LayoutButtonWidget extends LayoutWidget {
  constructor(parent, layout, gapSize, height, width) {
    super({
      parent,
      layout,
      containerRect: buildRectangle({ x: 0, y: 0, width, height }),
      innerGaps: buildMarginOf(gapSize),
      outerGaps: new Clutter.Margin()
    });
    this.relayout();
  }

  buildTile(parent, rect, gaps, tile) {
    return new SnapAssistTile({ parent, rect, gaps, tile });
  }
};
registerGObjectClass(_LayoutButtonWidget);
var LayoutButtonWidget = _LayoutButtonWidget;
var _LayoutButton = class _LayoutButton extends St.Button {
  constructor(parent, layout, gapSize, height, width) {
    super({
      styleClass: "layout-button button",
      xExpand: false,
      yExpand: false
    });
    parent.add_child(this);
    const scalingFactor = getScalingFactorOf(this)[1];
    this.child = new St.Widget();
    new LayoutButtonWidget(
      this.child,
      layout,
      gapSize,
      height * scalingFactor,
      width * scalingFactor
    );
  }
};
registerGObjectClass(_LayoutButton);
var LayoutButton = _LayoutButton;