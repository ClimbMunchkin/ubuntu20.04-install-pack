const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const AppDisplay = imports.ui.appDisplay;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;
const PanelMenu = imports.ui.panelMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Config = imports.misc.config;
const GObject = imports.gi.GObject;

var _version;

const COLUMNS_MIN = 6;
const COLUMNS_MAX = 12;
const COLUMNS_RANGE = COLUMNS_MAX - COLUMNS_MIN;

let _settings;
let columnsMenu;
var _columns, _compact;
var columnsChanged = false;
var reloadApps = false;

let _view = [];
let _signal = [];

const ColumnsMenu = new Lang.Class({
    Name: 'ColumnsMenu',
    Extends: PanelMenu.SystemIndicator,

    _init()
    {
        this.parent();

        this.buttonMenu = new PopupMenu.PopupBaseMenuItem({reactive: true});

        this.icon = new St.Icon({icon_name: 'view-app-grid-symbolic', style_class: 'popup-menu-icon'});
        this.buttonMenu.actor.add(this.icon);

        this.value = new St.Label({text: _columns.toString(), y_expand: true, y_align: Clutter.ActorAlign.CENTER});
        this.buttonMenu.actor.add(this.value);

        this.columns = new Slider.Slider((_columns - COLUMNS_MIN) / COLUMNS_RANGE);
        this.buttonMenu.actor.add(this.columns.actor, {expand: true});
        this.columns.connect(_version < 34 ? 'value-changed' : 'notify::value', () => this._columnsChanged());

        this.packed = new PopupMenu.PopupSwitchMenuItem(null, _compact);
        this.packed.label.visible = false;
        this.packed.actor.add_style_class_name('switch-box');
        this.buttonMenu.actor.add(this.packed.actor);
        this.packed.connect('toggled', (object) => this._packed(object.state));

        this.menu.addMenuItem(this.buttonMenu);
        this.menu.connect('menu-closed', _saveColumns);
    },

    destroy()
    {
        this.menu.destroy();
    },

    _columnsChanged()
    {
        var newValue = (this.columns.value * COLUMNS_RANGE + COLUMNS_MIN).toFixed(0);
        if (newValue != _columns)
        {
            columnsChanged = true;
            _columns = newValue;
            this.value.text = _columns.toString();
            setColumns(_columns, _compact);
        }
    },

    _packed(state)
    {
        columnsChanged = true;
        _compact = state;
        setColumns(_columns, _compact);
    }
});

function allView_init()
{
    _view['all'].apply(this, []);
    setGrid(this._grid, _columns, _compact);
}

function frequentView_init()
{
    _view['frequent'].apply(this, []);
    setGrid(this._grid, _columns, _compact);
}

function folderView_init(folder, id, parentView)
{
    _view['folder'].apply(this, [folder, id, parentView]);
    setGrid(this._grid, _columns, _compact);
}

function setGrid(grid, columns, compact)
{
    grid._colLimit = columns;
    grid._minColumns = compact ? columns : AppDisplay.MIN_COLUMNS;
}

function setColumns(columns, compact)
{
    setGrid(Main.overview.viewSelector.appDisplay._views[AppDisplay.Views.FREQUENT].view._grid, columns, compact);
    setGrid(Main.overview.viewSelector.appDisplay._views[AppDisplay.Views.ALL].view._grid, columns, compact);

    reloadApps = true;
    if (Main.overview.visible)
        overviewShowing();
}

function viewRedisplay(view)
{
    if (_version >= 36)
        Main.overview.viewSelector.appDisplay._views[view].view._grid.queue_relayout();
    else
        Main.overview.viewSelector.appDisplay._views[view].view._redisplay();
}

function overviewShowing()
{
    if (reloadApps && Main.overview.viewSelector._showAppsButton.checked)
    {
        viewRedisplay(AppDisplay.Views.FREQUENT);
        viewRedisplay(AppDisplay.Views.ALL);

        reloadApps = false;
    }
}

function _saveColumns()
{
    if (!columnsChanged)
        return;

    _settings.set_int('columns-max', _columns);
    _settings.set_boolean('compact-layout', _compact);

    columnsChanged = false;
}

function init()
{
    var schema = 'org.gnome.shell.extensions.app-view-columns' || Me.metadata['settings-schema'];

    const GioSSS = Gio.SettingsSchemaSource;
    let schemaSource = GioSSS.new_from_directory(Me.dir.get_child('schemas').get_path(), GioSSS.get_default(), false);

    let schemaObj = schemaSource.lookup(schema, true);
    if (!schemaObj)
        throw new Error('Schema ' + schema + ' not found for ' + Me.metadata.uuid);

    _settings = new Gio.Settings({ settings_schema: schemaObj });

    _version = parseInt(Config.PACKAGE_VERSION.split('.')[1]);
}

function enable()
{
    _view['all'] = AppDisplay.AllView.prototype._init;
    AppDisplay.AllView.prototype._init = allView_init;
    _view['frequent'] = AppDisplay.FrequentView.prototype._init;
    AppDisplay.FrequentView.prototype._init = frequentView_init;
    if (_version < 36)
    {
        _view['folder'] = AppDisplay.FolderView.prototype._init;
        AppDisplay.FolderView.prototype._init = folderView_init;
    }

    _signal['overview-showing'] = Main.overview.connect('showing', overviewShowing);

    _columns = _settings.get_int('columns-max');
    _compact = _settings.get_boolean('compact-layout');
    setColumns(_columns, _compact);

    columnsMenu = new ColumnsMenu();
    Main.panel.statusArea.aggregateMenu.menu.addMenuItem(columnsMenu.menu, 2);
}

function disable()
{
    Main.overview.disconnect(_signal['overview-showing']);
    AppDisplay.AllView.prototype._init = _view['all'];
    AppDisplay.FrequentView.prototype._init = _view['frequent'];
    if (_version < 36)
        AppDisplay.FolderView.prototype._init = _view['folder'];

    setColumns(AppDisplay.MAX_COLUMNS, false);

    columnsMenu.destroy();
}
