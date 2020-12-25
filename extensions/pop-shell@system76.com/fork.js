const Me = imports.misc.extensionUtils.getCurrentExtension();
const Ecs = Me.imports.ecs;
const Lib = Me.imports.lib;
const node = Me.imports.node;
const Rect = Me.imports.rectangle;
const XPOS = 0;
const YPOS = 1;
const WIDTH = 2;
const HEIGHT = 3;
var Fork = class Fork {
    constructor(entity, left, right, area, workspace, monitor, orient) {
        this.minimum_ratio = 0.1;
        this.orientation = Lib.Orientation.HORIZONTAL;
        this.orientation_changed = false;
        this.is_toplevel = false;
        this.smart_gapped = false;
        this.n_toggled = 0;
        this.area = area;
        this.left = left;
        this.right = right;
        this.workspace = workspace;
        this.length_left = orient === Lib.Orientation.HORIZONTAL
            ? this.area.width / 2
            : this.area.height / 2;
        this.prev_length_left = this.length_left;
        this.entity = entity;
        this.orientation = orient;
        this.monitor = monitor;
    }
    area_of_left(ext) {
        return new Rect.Rectangle(this.is_horizontal()
            ? [this.area.x, this.area.y, this.length_left - ext.gap_inner_half, this.area.height]
            : [this.area.x, this.area.y, this.area.width, this.length_left - ext.gap_inner_half]);
    }
    area_of_right(ext) {
        let area;
        if (this.is_horizontal()) {
            const width = this.area.width - this.length_left + ext.gap_inner;
            area = [width, this.area.y, this.area.width - width, this.area.height];
        }
        else {
            const height = this.area.height - this.length_left + ext.gap_inner;
            area = [this.area.x, height, this.area.width, this.area.height - height];
        }
        return new Rect.Rectangle(area);
    }
    depth() {
        return this.is_horizontal() ? this.area.height : this.area.width;
    }
    find_branch(entity) {
        const locate = (branch) => {
            switch (branch.inner.kind) {
                case 2:
                    if (Ecs.entity_eq(branch.inner.entity, entity)) {
                        return branch;
                    }
                    break;
                case 3:
                    for (const e of branch.inner.entities) {
                        if (Ecs.entity_eq(e, entity)) {
                            return branch;
                        }
                    }
            }
            return null;
        };
        const node = locate(this.left);
        if (node)
            return node;
        return this.right ? locate(this.right) : null;
    }
    is_horizontal() {
        return Lib.Orientation.HORIZONTAL == this.orientation;
    }
    length() {
        return this.is_horizontal() ? this.area.width : this.area.height;
    }
    replace_window(ext, a, b) {
        let closure = null;
        let check_right = () => {
            if (this.right) {
                const inner = this.right.inner;
                if (inner.kind === 2) {
                    closure = () => {
                        inner.entity = b.entity;
                    };
                }
                else if (inner.kind === 3) {
                    const idx = node.stack_find(inner, a.entity);
                    if (idx === null) {
                        closure = null;
                        return;
                    }
                    closure = () => {
                        node.stack_replace(ext, inner, b);
                        inner.entities[idx] = b.entity;
                    };
                }
            }
        };
        switch (this.left.inner.kind) {
            case 1:
                check_right();
                break;
            case 2:
                const inner = this.left.inner;
                if (Ecs.entity_eq(inner.entity, a.entity)) {
                    closure = () => {
                        inner.entity = b.entity;
                    };
                }
                else {
                    check_right();
                }
                break;
            case 3:
                const inner_s = this.left.inner;
                let idx = node.stack_find(inner_s, a.entity);
                if (idx !== null) {
                    const id = idx;
                    closure = () => {
                        node.stack_replace(ext, inner_s, b);
                        inner_s.entities[id] = b.entity;
                    };
                }
                else {
                    check_right();
                }
        }
        return closure;
    }
    set_area(area) {
        this.area = area;
        return this.area;
    }
    set_ratio(left_length) {
        const fork_len = this.is_horizontal() ? this.area.width : this.area.height;
        const clamped = Math.round(Math.max(256, Math.min(fork_len - 256, left_length)));
        this.prev_length_left = clamped;
        this.length_left = clamped;
        return this;
    }
    set_toplevel(tiler, entity, string, id) {
        this.is_toplevel = true;
        tiler.toplevel.set(string, [entity, id]);
        return this;
    }
    measure(tiler, ext, area, record) {
        let ratio;
        if (!this.is_toplevel) {
            if (this.orientation_changed) {
                this.orientation_changed = false;
                ratio = this.length_left / this.depth();
            }
            else {
                ratio = this.length_left / this.length();
            }
            this.area = this.set_area(area.clone());
        }
        else if (this.orientation_changed) {
            this.orientation_changed = false;
            ratio = this.length_left / this.depth();
        }
        if (ratio) {
            this.length_left = Math.round(ratio * this.length());
        }
        if (this.right) {
            const [l, p, startpos] = this.is_horizontal() ? [WIDTH, XPOS, this.area.x] : [HEIGHT, YPOS, this.area.y];
            let region = this.area.clone();
            const half = this.area.array[l] / 2;
            let length;
            if (this.length_left > half - 32 && this.length_left < half + 32) {
                length = half;
            }
            else {
                const diff = (startpos + this.length_left) % 32;
                length = this.length_left - diff + (diff > 16 ? 32 : 0);
                if (length == 0)
                    length = 32;
            }
            region.array[l] = length - ext.gap_inner_half;
            this.left.measure(tiler, ext, this.entity, region, record);
            region.array[p] = region.array[p] + length + ext.gap_inner_half;
            region.array[l] = this.area.array[l] - length - ext.gap_inner_half;
            this.right.measure(tiler, ext, this.entity, region, record);
        }
        else {
            this.left.measure(tiler, ext, this.entity, this.area, record);
        }
    }
    migrate(ext, forest, area, monitor, workspace) {
        if (this.is_toplevel) {
            forest.toplevel.set(forest.string_reps.get(this.entity), [this.entity, [monitor, workspace]]);
            if (this.workspace !== workspace) {
                this.workspace = workspace;
                for (const child_node of forest.iter(this.entity, node.NodeKind.FORK)) {
                    let child = forest.forks.get(child_node.inner.entity);
                    if (child)
                        child.workspace = workspace;
                }
            }
            this.set_area(area.clone());
            this.measure(forest, ext, area, forest.on_record());
            forest.arrange(ext, workspace, true);
        }
        else {
        }
    }
    rebalance_orientation() {
        this.set_orientation(this.area.height > this.area.width
            ? Lib.Orientation.VERTICAL
            : Lib.Orientation.HORIZONTAL);
    }
    set_orientation(o) {
        if (o !== this.orientation) {
            this.orientation = o;
            this.orientation_changed = true;
        }
    }
    toggle_orientation() {
        this.orientation = Lib.Orientation.HORIZONTAL === this.orientation
            ? Lib.Orientation.VERTICAL
            : Lib.Orientation.HORIZONTAL;
        this.orientation_changed = true;
        if (this.n_toggled === 1) {
            if (this.right) {
                const tmp = this.right;
                this.right = this.left;
                this.left = tmp;
            }
            this.n_toggled = 0;
        }
        else {
            this.n_toggled += 1;
        }
    }
}
//# sourceMappingURL=fork.js.map