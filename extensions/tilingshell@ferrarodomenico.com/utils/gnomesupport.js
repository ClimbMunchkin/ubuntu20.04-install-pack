// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var St = Me.imports.gi.ext.St;
var Clutter = Me.imports.gi.ext.Clutter;
var Shell = Me.imports.gi.ext.Shell;
var Meta = Me.imports.gi.ext.Meta;

function widgetOrientation(vertical) {
  if (St.BoxLayout.prototype.get_orientation !== void 0) {
    return {
      orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL
    };
  }
  return { vertical };
}

function buildBlurEffect(sigma) {
  const effect = new Shell.BlurEffect();
  effect.set_mode(Shell.BlurMode.BACKGROUND);
  effect.set_brightness(1);
  if (effect.set_radius) {
    effect.set_radius(sigma * 2);
  } else {
    effect.set_sigma(sigma);
  }
  return effect;
}

function getEventCoords(event) {
  return event.get_coords ? event.get_coords() : [event.x, event.y];
}

function maximizeWindow(window) {
  window.get_maximized ? window.maximize(Meta.MaximizeFlags.BOTH) : window.maximize();
}

function unmaximizeWindow(window) {
  window.get_maximized ? window.unmaximize(Meta.MaximizeFlags.BOTH) : window.unmaximize();
}

function getDefaultSeat() {
  const clutter = Clutter;
  const backend = clutter.get_default_backend ? clutter.get_default_backend() : global.stage.get_context().get_backend();
  return backend.get_default_seat();
}