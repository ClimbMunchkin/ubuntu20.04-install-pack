// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var St = Me.imports.gi.ext.St;
var Meta = Me.imports.gi.ext.Meta;
var Mtk = Me.imports.gi.ext.Mtk;
var Clutter = Me.imports.gi.ext.Clutter;
var GLib = Me.imports.gi.ext.GLib;
var Main = imports.ui.main;
var Config = imports.misc.config;
var getMonitors = () => Main.layoutManager.monitors;
var isPointInsideRect = (point, rect) => {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
};
var clampPointInsideRect = (point, rect) => {
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  return {
    x: clamp(point.x, rect.x, rect.x + rect.width),
    y: clamp(point.y, rect.y, rect.y + rect.height)
  };
};
var isTileOnContainerBorder = (tilePos, container) => {
  const almostEqual = (first, second) => Math.abs(first - second) <= 1;
  const isLeft = almostEqual(tilePos.x, container.x);
  const isTop = almostEqual(tilePos.y, container.y);
  const isRight = almostEqual(
    tilePos.x + tilePos.width,
    container.x + container.width
  );
  const isBottom = almostEqual(
    tilePos.y + tilePos.height,
    container.y + container.height
  );
  return {
    isTop,
    isRight,
    isBottom,
    isLeft
  };
};
var buildTileGaps = (tilePos, innerGaps, outerGaps, container, scalingFactor = 1) => {
  const { isTop, isRight, isBottom, isLeft } = isTileOnContainerBorder(
    tilePos,
    container
  );
  const margin = new Clutter.Margin();
  margin.top = (isTop ? outerGaps.top : innerGaps.top / 2) * scalingFactor;
  margin.bottom = (isBottom ? outerGaps.bottom : innerGaps.bottom / 2) * scalingFactor;
  margin.left = (isLeft ? outerGaps.left : innerGaps.left / 2) * scalingFactor;
  margin.right = (isRight ? outerGaps.right : innerGaps.right / 2) * scalingFactor;
  return {
    gaps: margin,
    isTop,
    isRight,
    isBottom,
    isLeft
  };
};
var isFractionalScalingEnabled = (mutterSettings) => {
  const GNOME_VERSION_MAJOR = Number(Config.PACKAGE_VERSION.split(".")[0]);
  const isWayland = Meta.is_wayland_compositor ? Meta.is_wayland_compositor() : GLib.getenv("XDG_SESSION_TYPE") === "wayland";
  if (isWayland && GNOME_VERSION_MAJOR >= 49) return true;
  return mutterSettings.get_strv("experimental-features").find(
    (feat) => feat === "scale-monitor-framebuffer" || feat === "x11-randr-fractional-scaling"
  ) !== void 0;
};
var getMonitorScalingFactor = (monitorIndex) => {
  const scalingFactor = St.ThemeContext.get_for_stage(
    global.get_stage()
  ).get_scale_factor();
  if (scalingFactor === 1)
  return global.display.get_monitor_scale(monitorIndex);
  return scalingFactor;
};
var getScalingFactorOf = (widget) => {
  const [hasReference, scalingReference] = widget.get_theme_node().lookup_length("scaling-reference", true);
  if (!hasReference) return [true, 1];
  const [hasValue, monitorScalingFactor] = widget.get_theme_node().lookup_length("monitor-scaling-factor", true);
  if (!hasValue) return [true, 1];
  return [scalingReference !== 1, monitorScalingFactor / scalingReference];
};
var enableScalingFactorSupport = (widget, monitorScalingFactor) => {
  if (!monitorScalingFactor) return;
  widget.set_style(`${getScalingFactorSupportString(monitorScalingFactor)};`);
};
var getScalingFactorSupportString = (monitorScalingFactor) => {
  return `scaling-reference: 1px; monitor-scaling-factor: ${monitorScalingFactor}px`;
};

function buildMarginOf(value) {
  const margin = new Clutter.Margin();
  margin.top = value;
  margin.bottom = value;
  margin.left = value;
  margin.right = value;
  return margin;
}

function buildMargin(params) {
  const margin = new Clutter.Margin();
  if (params.top) margin.top = params.top;
  if (params.bottom) margin.bottom = params.bottom;
  if (params.left) margin.left = params.left;
  if (params.right) margin.right = params.right;
  return margin;
}

function buildRectangle(params = {}) {
  return new Mtk.Rectangle({
    x: params.x || 0,
    y: params.y || 0,
    width: params.width || 0,
    height: params.height || 0
  });
}

function getTransientOrParent(window) {
  const transient = window.get_transient_for();
  return window.is_attached_dialog() && transient !== null ? transient : window;
}

function filterUnfocusableWindows(windows) {
  return windows.map(getTransientOrParent).filter((win, idx, arr) => {
    return win !== null && !win.skipTaskbar && arr.indexOf(win) === idx;
  });
}

function getWindows(workspace) {
  if (!workspace) workspace = global.workspaceManager.get_active_workspace();
  return filterUnfocusableWindows(
    global.display.get_tab_list(Meta.TabList.NORMAL_ALL, workspace)
  );
}

function getWindowsOfMonitor(monitor) {
  return global.workspaceManager.get_active_workspace().list_windows().filter(
    (win) => win.get_window_type() === Meta.WindowType.NORMAL && Main.layoutManager.monitors[win.get_monitor()] === monitor
  );
}

function squaredEuclideanDistance(pointA, pointB) {
  return (pointA.x - pointB.x) * (pointA.x - pointB.x) + (pointA.y - pointB.y) * (pointA.y - pointB.y);
}