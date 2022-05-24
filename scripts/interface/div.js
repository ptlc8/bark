"use strict";
// public extends ContainerComponent
var InterfaceDiv = (function() {
    class InterfaceDiv {
		constructor(color = [0.6, 0.6, 0.6, 0.8], transient = undefined) {
			this.color = color;
			this.components = [];
			this.visible = false;
			this.selectedComponent = transient || 0;
			this.focus = false;
			this.transient = transient !== undefined;
		}
		add(component) {
			this.components.push(component);
		}
		setVisible(visible = true) {
			this.visible = visible;
			this.focus = visible;
			if (this.transient && this.focus)
				this.click();
		}
		toggleVisible() {
			this.visible = !this.visible;
			this.focus = this.visible;
			if (this.transient && this.focus)
				this.click();
		}
		isVisible() {
			return this.visible;
		}
		next() {
			if (!this.focus)
				return this.components[this.selectedComponent].next();
			if (++this.selectedComponent >= this.components.length)
				this.selectedComponent = 0;
		}
		previous() {
			if (!this.focus)
				return this.components[this.selectedComponent].previous();
			if (--this.selectedComponent < 0)
				this.selectedComponent = this.components.length - 1;
		}
		nextRow() {
			if (!this.focus)
				return this.components[this.selectedComponent].nextRow();
		}
		previousRow() {
			if (!this.focus)
				return this.components[this.selectedComponent].previousRow();
		}
		draw(renderer, x, y, width) {
			var height = this.getHeight();
			renderer.drawInterfaceQuad(x, y, width, height, this.color);
			y += height / 2 - 0.05;
			width *= 0.9;
			let i = 0;
			for (let component of this.components) {
				component.draw(renderer, x, y - component.getHeight() / 2, width);
				if (this.focus && this.selectedComponent == i) {
					renderer.drawInterfaceQuad(x, y - .005, width, .01, [1, 1, 1, 0.8]);
					renderer.drawInterfaceQuad(x, y - component.getHeight() + .005, width, .01, [1, 1, 1, 0.8]);
					renderer.drawInterfaceQuad(x + width / 2 - .005, y - component.getHeight() / 2, .01, component.getHeight(), [1, 1, 1, 0.8]);
					renderer.drawInterfaceQuad(x - width / 2 + .005, y - component.getHeight() / 2, .01, component.getHeight(), [1, 1, 1, 0.8]);
				}
				y += -component.getHeight() - 0.01;
				i++;
			}
		}
		getHeight() {
			var height = 0.05;
			for (let component of this.components)
				height += component.getHeight() + 0.01;
			return height + 0.04;
		}
		click(button = 0) {
			if (this.selectedComponent < this.components.length) {
				if (this.focus && this.components[this.selectedComponent] instanceof InterfaceDiv || this.components[this.selectedComponent] instanceof InterfaceGrid) {
					this.focus = false;
					this.components[this.selectedComponent].focus = true;
				} else {
					this.components[this.selectedComponent].click(button);
				}
			}
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
	}
    
    return InterfaceDiv;
})();