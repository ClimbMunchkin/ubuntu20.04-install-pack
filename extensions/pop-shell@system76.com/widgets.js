const { Clutter, Pango, St } = imports.gi;
var Box = class Box {
    constructor(args) {
        this.container = new St.BoxLayout(args);
    }
    add(child) {
        this.container.add_child(child);
        return this;
    }
}
function application_button(title, category_icon, app_icon) {
    let layout = new Box({});
    category_icon.set_y_align(Clutter.ActorAlign.CENTER);
    app_icon.set_y_align(Clutter.ActorAlign.CENTER);
    let label = new St.Label({
        text: title,
        styleClass: "pop-shell-search-label",
        y_align: Clutter.ActorAlign.CENTER
    });
    label.clutter_text.set_ellipsize(Pango.EllipsizeMode.END);
    layout.add(category_icon).add(app_icon).add(label);
    let container = new St.Button({ styleClass: "pop-shell-search-element" });
    container.add_actor(layout.container);
    return container;
}
//# sourceMappingURL=widgets.js.map