// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
function rect_to_string(rect) {
  return `{x: ${rect.x}, y: ${rect.y}, width: ${rect.width}, height: ${rect.height}}`;
}
var logger = (prefix) => (...content) => console.log("[tilingshell]", `[${prefix}]`, ...content);