"use strict";
// public
var InterfaceDiv = (function() {
    class InterfaceDiv extends InterfaceParent {
		constructor(transient = undefined, color = [0.6, 0.6, 0.6, 0.8]) {
			super(transient);
			this.color = color;
		}
		add(component) {
			this.components.push(component);
		}
		next() {
			if (!this.focus)
				return this.components[this.selectedComponent].next();
			if (++this.selectedComponent >= this.components.length)
				this.selectedComponent = 0;
			if (this.onSelect)
				this.onSelect(this.selectedComponent);
		}
		previous() {
			if (!this.focus)
				return this.components[this.selectedComponent].previous();
			if (--this.selectedComponent < 0)
				this.selectedComponent = this.components.length - 1;
			if (this.onSelect)
				this.onSelect(this.selectedComponent);
		}
		nextCol() {
			if (!this.focus)
				return this.components[this.selectedComponent].nextCol();
		}
		previousCol() {
			if (!this.focus)
				return this.components[this.selectedComponent].previousCol();
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
	}
    
    return InterfaceDiv;
})();