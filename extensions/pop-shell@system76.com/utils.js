const Me = imports.misc.extensionUtils.getCurrentExtension();
const result = Me.imports.result;
const error = Me.imports.error;
const { Gio, GLib, GObject, Meta } = imports.gi;
const { Ok, Err } = result;
const { Error } = error;
function is_wayland() {
    return Meta.is_wayland_compositor();
}
function block_signal(object, signal) {
    GObject.signal_handler_block(object, signal);
}
function unblock_signal(object, signal) {
    GObject.signal_handler_unblock(object, signal);
}
function read_to_string(path) {
    const file = Gio.File.new_for_path(path);
    try {
        const [ok, contents,] = file.load_contents(null);
        if (ok) {
            return Ok(imports.byteArray.toString(contents));
        }
        else {
            return Err(new Error(`failed to load contents of ${path}`));
        }
    }
    catch (e) {
        return Err(new Error(String(e))
            .context(`failed to load contents of ${path}`));
    }
}
function source_remove(id) {
    return GLib.source_remove(id);
}
function exists(path) {
    return Gio.File.new_for_path(path).query_exists(null);
}
function is_dark(color) {
    let color_val = "";
    let r = 255;
    let g = 255;
    let b = 255;
    if (color.indexOf('rgb') >= 0) {
        color = color.replace('rgba', 'rgb')
            .replace('rgb(', '')
            .replace(')', '');
        let colors = color.split(',');
        r = parseInt(colors[0].trim());
        g = parseInt(colors[1].trim());
        b = parseInt(colors[2].trim());
    }
    else if (color.charAt(0) === '#') {
        color_val = color.substring(1, 7);
        r = parseInt(color_val.substring(0, 2), 16);
        g = parseInt(color_val.substring(2, 4), 16);
        b = parseInt(color_val.substring(4, 6), 16);
    }
    let uicolors = [r / 255, g / 255, b / 255];
    let c = uicolors.map((col) => {
        if (col <= 0.03928) {
            return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    let L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
    return (L <= 0.179);
}
function async_process(argv, input = null, cancellable = null) {
    let flags = Gio.SubprocessFlags.STDOUT_PIPE;
    if (input !== null)
        flags |= Gio.SubprocessFlags.STDIN_PIPE;
    let proc = new Gio.Subprocess({
        argv: argv,
        flags: flags
    });
    proc.init(cancellable);
    return new Promise((resolve, reject) => {
        proc.communicate_utf8_async(input, cancellable, (proc, res) => {
            try {
                let bytes = proc.communicate_utf8_finish(res)[1];
                resolve(bytes.toString());
            }
            catch (e) {
                reject(e);
            }
        });
    });
}
//# sourceMappingURL=utils.js.map