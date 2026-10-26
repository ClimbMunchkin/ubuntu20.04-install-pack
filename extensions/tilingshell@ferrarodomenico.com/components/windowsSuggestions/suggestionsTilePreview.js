// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var registerGObjectClass = Me.imports.utils.gjs.registerGObjectClass;
var GObject = Me.imports.gi.ext.GObject;
var St = Me.imports.gi.ext.St;
var Clutter = Me.imports.gi.ext.Clutter;
var TilePreview = Me.imports.components.tilepreview.tilePreview.TilePreview;
var buildBlurEffect = Me.imports.utils.gnomesupport.buildBlurEffect;
var widgetOrientation = Me.imports.utils.gnomesupport.widgetOrientation;
var MasonryLayoutManager = Me.imports.components.windowsSuggestions.masonryLayoutManager.MasonryLayoutManager;
var TouchEventHelper = Me.imports.utils.touch.TouchEventHelper;
var MASONRY_LAYOUT_SPACING = 32;
var SCROLLBARS_SHOW_ANIM_DURATION = 100;
var _SuggestionsTilePreview = class _SuggestionsTilePreview extends TilePreview {
  _blur;
  _container;
  _scrollView;
  _touchHelper;
  constructor(params) {
    super(params);
    this._blur = false;
    this._recolor();
    const styleChangedSignalID = St.ThemeContext.get_for_stage(
      global.get_stage()
    ).connect("changed", () => {
      this._recolor();
    });
    this.connect(
      "destroy",
      () => St.ThemeContext.get_for_stage(global.get_stage()).disconnect(
        styleChangedSignalID
      )
    );
    this.reactive = true;
    this.layout_manager = new Clutter.BinLayout();
    this._container = new St.BoxLayout({
      x_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
      style: `spacing: ${MASONRY_LAYOUT_SPACING}px;`,
      ...widgetOrientation(true)
    });
    this._scrollView = new St.ScrollView({
      style_class: "vfade",
      vscrollbar_policy: St.PolicyType.AUTOMATIC,
      hscrollbar_policy: St.PolicyType.NEVER,
      overlay_scrollbars: true,
      clip_to_allocation: true,
      // Ensure clipping
      x_expand: true,
      y_expand: true
    });
    if (this._scrollView.add_actor)
    this._scrollView.add_actor(this._container);else
    this._scrollView.add_child(this._container);
    this.add_child(this._scrollView);
    if (
    // @ts-expect-error "get_hscroll_bar is valid for GNOME < 48"
    this._scrollView.get_hscroll_bar && // @ts-expect-error "get_vscroll_bar is valid for GNOME < 48"
    this._scrollView.get_vscroll_bar)
    {
      this._scrollView.get_hscroll_bar().opacity = 0;
      this._scrollView.get_vscroll_bar().opacity = 0;
    }
    this._touchHelper = new TouchEventHelper();
  }

  set blur(value) {
    if (this._blur === value) return;
    this._blur = value;
  }

  set gaps(newGaps) {
    super.gaps = newGaps;
    this.updateBorderRadius(
      this._gaps.top > 0,
      this._gaps.right > 0,
      this._gaps.bottom > 0,
      this._gaps.left > 0
    );
  }

  _init() {
    super._init();
    const effect = buildBlurEffect(48);
    effect.set_name("blur");
    effect.set_enabled(this._blur);
    this.add_effect(effect);
    this.add_style_class_name("selection-tile-preview");
    this._setupTouchScrolling();
  }

  _recolor() {
    this.set_style(null);
    const backgroundColor = this.get_theme_node().get_background_color().copy();
    const newAlpha = Math.max(
      Math.min(backgroundColor.alpha + 35, 255),
      160
    );
    this.set_style(`
            background-color: rgba(${backgroundColor.red}, ${backgroundColor.green}, ${backgroundColor.blue}, ${newAlpha / 255}) !important;
        `);
  }

  _showScrollBars() {
    if (
    // @ts-expect-error "get_hscroll_bar is valid for GNOME < 48"
    this._scrollView.get_hscroll_bar && // @ts-expect-error "get_vscroll_bar is valid for GNOME < 48"
    this._scrollView.get_vscroll_bar)
    {
      [
      // @ts-expect-error "get_hscroll_bar is valid for GNOME < 48"
      this._scrollView.get_hscroll_bar(),
      // @ts-expect-error "get_vscroll_bar is valid for GNOME < 48"
      this._scrollView.get_vscroll_bar()].
      forEach(
        (bar) => bar?.ease({
          opacity: 255,
          duration: SCROLLBARS_SHOW_ANIM_DURATION
        })
      );
    }
  }

  _hideScrollBars() {
    if (
    // @ts-expect-error "get_hscroll_bar is valid for GNOME < 48"
    this._scrollView.get_hscroll_bar && // @ts-expect-error "get_vscroll_bar is valid for GNOME < 48"
    this._scrollView.get_vscroll_bar)
    {
      [
      // @ts-expect-error "get_hscroll_bar is valid for GNOME < 48"
      this._scrollView.get_hscroll_bar(),
      // @ts-expect-error "get_vscroll_bar is valid for GNOME < 48"
      this._scrollView.get_vscroll_bar()].
      forEach(
        (bar) => bar?.ease({
          opacity: 0,
          duration: SCROLLBARS_SHOW_ANIM_DURATION
        })
      );
    }
  }

  vfunc_enter_event(event) {
    this._showScrollBars();
    return super.vfunc_enter_event(event);
  }

  vfunc_leave_event(event) {
    this._hideScrollBars();
    return super.vfunc_leave_event(event);
  }

  addWindows(windows, maxRowHeight) {
    this._container.hide();
    this._container.destroy_all_children();
    windows.forEach((actor) => this._container.add_child(actor));
    this._container.queue_relayout();
    const placements = MasonryLayoutManager.computePlacements(
      windows,
      this.innerWidth - 2 * MASONRY_LAYOUT_SPACING,
      this.innerHeight,
      maxRowHeight
    );
    this._container.remove_all_children();
    this._container.show();
    this._container.add_child(
      new St.Widget({ height: MASONRY_LAYOUT_SPACING })
    );
    placements.forEach((row) => {
      const rowBox = new St.BoxLayout({
        x_align: Clutter.ActorAlign.CENTER,
        style: `spacing: ${MASONRY_LAYOUT_SPACING}px;`
      });
      this._container.add_child(rowBox);
      row.forEach((pl) => {
        rowBox.add_child(pl.actor);
        pl.actor.set_height(pl.height);
        pl.actor.set_width(pl.width);
      });
    });
    this._container.add_child(
      new St.Widget({ height: MASONRY_LAYOUT_SPACING })
    );
  }

  removeAllWindows() {
    this._container.destroy_all_children();
  }

  _setupTouchScrolling() {
    this.connect("touch-event", (_, event) => {
      return this._touchHelper.convertPanToScroll(
        event,
        this._scrollView
      );
    });
  }
};
registerGObjectClass(_SuggestionsTilePreview, {
  GTypeName: "PopupTilePreview",
  Properties: {
    blur: GObject.ParamSpec.boolean(
      "blur",
      "blur",
      "Enable or disable the blur effect",
      GObject.ParamFlags.READWRITE,
      false
    )
  }
});
var SuggestionsTilePreview = _SuggestionsTilePreview;