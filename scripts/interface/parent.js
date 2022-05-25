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
				this.click();
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
        back() {}
		setOnSelect(onSelect) {
			this.onSelect = onSelect;
		}
    }
    
    return InterfaceParent;
})();