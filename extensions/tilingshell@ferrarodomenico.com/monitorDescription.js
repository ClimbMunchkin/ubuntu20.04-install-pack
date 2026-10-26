#!@GJS@ -m
var Gtk = imports.gi.Gtk;
var Gdk = imports.gi.Gdk;
//const { Gtk, Gdk } = imports.gi;

Gtk.init();
var monitors = Gdk.Display.get_default().get_monitors();
var details = [];
for (const m of monitors) {
  const { x, y, width, height } = m.get_geometry();
  details.push({ name: m.get_description(), x, y, width, height });
}

print(JSON.stringify(details));