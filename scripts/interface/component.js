"use strict";
// public abstract
var InterfaceComponent = (function() {
    class InterfaceComponent {
        constructor() {
            this.visible = true;
            this.onrefresh = undefined;
		}
		setOnRefresh(onrefresh) {
			this.onrefresh = onrefresh;
		}
		refresh() {
			if (this.onrefresh)
				this.onrefresh();
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
        click(x, y, click) {}
        draw(renderer, x, y, width) {}
        getHeight() {}
    }
    return InterfaceComponent;
})();