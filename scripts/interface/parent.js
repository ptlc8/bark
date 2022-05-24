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
        }
        setFocus(focus = true) {
			this.focus = focus;
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
    }
    
    return InterfaceParent;
})();