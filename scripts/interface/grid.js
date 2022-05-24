"use strict";
// public extends ContainerComponent
var InterfaceGrid = (function() {
    class InterfaceGrid {
		constructor(componentsByLine, color = [.6, .6, .6, .8]) {
			this.componentsByLine = componentsByLine;
			this.color = color;
			this.components = [];
			this.visible = false;
			this.selectedComponent = 0;
			this.focus = false;
		}
		add(component) {
			this.components.push(component);
		}
		setVisible(visible = true) {
			this.visible = visible;
		}
		toggleVisible() {
			this.visible = !this.visible;
		}
		isVisible() {
			return this.visible;
		}
		next() {
			if (!this.focus)
				return this.components[this.selectedComponent].next();
			this.selectedComponent += this.componentsByLine;
			if (this.selectedComponent >= this.components.length)
				this.selectedComponent %= this.componentsByLine;
		}
		previous() {
			if (!this.focus)
				return this.components[this.selectedComponent].previous();
			this.selectedComponent -= this.componentsByLine;
			if (this.selectedComponent < 0) {
				this.selectedComponent = parseInt(this.components.length / this.componentsByLine + 1) * (this.componentsByLine) + this.selectedComponent;
				if (this.selectedComponent >= this.components.length)
					this.selectedComponent -= this.componentsByLine;
			}
		}
		nextRow() {
			if (!this.focus)
				return this.components[this.selectedComponent].next();
			if (++this.selectedComponent >= this.components.length)
				this.selectedComponent = 0;
		}
		previousRow() {
			if (!this.focus)
				return this.components[this.selectedComponent].previous();
			if (--this.selectedComponent < 0)
				this.selectedComponent = this.components.length - 1;
		}
		draw(renderer, X, Y, Width) {
			var Height = this.getHeight();
			renderer.drawInterfaceQuad(X, Y, Width, Height, this.color);
			Width *= 0.9;
			let y = Y + Height / 2 - 0.05;
			let width = Width / this.componentsByLine - 0.01;
			let x = X - Width / 2 + width / 2;
			let height = 0;
			for (let i = 0; i < this.components.length; i++) {
				let component = this.components[i];
				component.draw(renderer, x, y - component.getHeight() / 2, width);
				if (this.focus && this.selectedComponent == i) {
					renderer.drawInterfaceQuad(x, y - .005, width, .01, [1, 1, 1, 0.8]);
					renderer.drawInterfaceQuad(x, y - component.getHeight() + .005, width, .01, [1, 1, 1, 0.8]);
					renderer.drawInterfaceQuad(x + width / 2 - .005, y - component.getHeight() / 2, .01, component.getHeight(), [1, 1, 1, 0.8]);
					renderer.drawInterfaceQuad(x - width / 2 + .005, y - component.getHeight() / 2, .01, component.getHeight(), [1, 1, 1, 0.8]);
				}
				height = Math.max(height, component.getHeight());
				if (i % this.componentsByLine == this.componentsByLine - 1) { // end of line
					y += -height - 0.01;
					x = X - Width / 2 + width / 2;
					height = 0;
				} else {
					x += width + 0.01;
				}
			}
		}
		getHeight() {
			var height = 0.05;
			for (let i = 0; i < this.components.length / this.componentsByLine; i++) {
				let lineHeight = 0;
				for (let j = 0; j < this.components.length - i * this.componentsByLine; j++) {
					lineHeight = Math.max(lineHeight, this.components[i].getHeight());
				}
				height += lineHeight + 0.01;
			}
			return height + 0.04;
		}
		click(button = 0) {
			if (this.selectedComponent < this.components.length) {
				if (this.focus && (this.components[this.selectedComponent] instanceof InterfaceDiv || this.components[this.selectedComponent] instanceof InterfaceGrid)) {
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
				if (this.components[this.selectedComponent].back())
					this.focus = true;
				return false;
			}
		}
	}
    
    return InterfaceGrid;
})();