// For GNOME Shell version before 45
const Me = imports.misc.extensionUtils.getCurrentExtension();
var St = Me.imports.gi.ext.St;
var createButton = Me.imports.indicator.utils.createButton;
var PopupMenu = imports.ui.popupMenu;
var _ = Me.imports.translations._;
var widgetOrientation = Me.imports.utils.gnomesupport.widgetOrientation;

var EditingMenu = class EditingMenu {
  _indicator;
  constructor(indicator) {
    this._indicator = indicator;
    const boxLayout = new St.BoxLayout({
      styleClass: "buttons-box-layout",
      xExpand: true,
      style: "spacing: 8px",
      ...widgetOrientation(true)
    });
    const openMenuBtn = createButton(
      "menu-symbolic",
      _("Menu"),
      this._indicator.path
    );
    openMenuBtn.connect("clicked", () => this._indicator.openMenu(false));
    boxLayout.add_child(openMenuBtn);
    const infoMenuBtn = createButton(
      "info-symbolic",
      _("Info"),
      this._indicator.path
    );
    infoMenuBtn.connect("clicked", () => this._indicator.openMenu(true));
    boxLayout.add_child(infoMenuBtn);
    const saveBtn = createButton(
      "save-symbolic",
      _("Save"),
      this._indicator.path
    );
    saveBtn.connect("clicked", () => {
      this._indicator.menu.toggle();
      this._indicator.saveLayoutOnClick();
    });
    boxLayout.add_child(saveBtn);
    const cancelBtn = createButton(
      "cancel-symbolic",
      _("Cancel"),
      this._indicator.path
    );
    cancelBtn.connect("clicked", () => {
      this._indicator.menu.toggle();
      this._indicator.cancelLayoutOnClick();
    });
    boxLayout.add_child(cancelBtn);
    const menuItem = new PopupMenu.PopupBaseMenuItem({
      style_class: "indicator-menu-item"
    });
    menuItem.add_child(boxLayout);
    this._indicator.menu.addMenuItem(menuItem);
  }

  destroy() {
    this._indicator.menu.removeAll();
  }
};