"use strict";
// public abstract
var InterfaceParent = (function() {
    class InterfaceParent extends InterfaceComponent {
        constructor(transient = undefined) {
            super();
            this.focus = false;
			this.components = [];
			this.selectedComponent = transient || 0;
			this.transient = transient !== undefined;
			this.onSelect = undefined;
        }
        setFocus(focus = true) {
			this.focus = focus;
			if (focus && this.onSelect)
				this.onSelect(this.selectedComponent);
			if (this.transient && this.focus)
				this.action();
		}
		toggleFocus() {
			this.setFocus(!this.focus);
		}
        isFocus() {
			return this.focus;
		}
		add(component) {
			this.components.push(component);
		}
        next() {}
        previous() {}
        nextCol() {}
        previousCol() {}
		action(button) {
			if (this.selectedComponent < this.components.length) {
				if (this.focus && this.components[this.selectedComponent] instanceof InterfaceParent) {
					this.focus = false;
					this.components[this.selectedComponent].setFocus(true);
				} else {
					return this.components[this.selectedComponent].action(button);
				}
			}
			return false;
		}
		back() {
			if (this.focus) {
				this.focus = false;
				return true;
			} else {
				if (this.components[this.selectedComponent].back()) {
					if (this.transient)
						return true;
					this.focus = true;
				}
				return false;
			}
		}
		setOnSelect(onSelect) {
			this.onSelect = onSelect;
		}
    }
    
    return InterfaceParent;
})();