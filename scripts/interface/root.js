"use strict";
// public
var InterfaceRoot = (function() {
    class InterfaceRoot extends InterfaceComponent {
        constructor() {
            super();
            this.focus = false;
			this.components = [];
			this.selectedComponent = 0;
            this.registredComponents = {};
        }
        open(name) {
            if (this.registredComponents[name] !== undefined) {
                this.close();
                this.selectedComponent = this.registredComponents[name];
                this.focus = true;
                this.components[this.selectedComponent].setVisible(true);
                this.components[this.selectedComponent].refresh();
                if (this.components[this.selectedComponent] instanceof InterfaceParent) {
                    this.components[this.selectedComponent].setFocus(true);
                }
            }
		}
        close() {
            this.focus = false;
            this.components[this.selectedComponent].setVisible(false);
            this.components[this.selectedComponent].setFocus(false);
        }
        isFocus() {
			return this.focus;
		}
        register(name, component) {
            this.registredComponents[name] = this.components.length;
            this.components.push(component);
        }
		add(component) {
			this.components.push(component);
		}
        action(button) {
            return this.components[this.selectedComponent].action(button);
        }
        draw(renderer, x, y, width) {
            for (var component of this.components)
		        if (component.isVisible())
                    component.draw(renderer, x, y, width);
        }
        back() {
            if (this.components[this.selectedComponent].back()) {
                this.focus = false;
                this.components[this.selectedComponent].setVisible(false);
            }
        }
        next() {
            this.components[this.selectedComponent].next();
        }
        previous() {
            this.components[this.selectedComponent].previous();
        }
        nextCol() {
            this.components[this.selectedComponent].nextCol();
        }
        previousCol() {
            this.components[this.selectedComponent].previousCol();
        }
        getHeight() {}
    }
    
    return InterfaceRoot;
})();