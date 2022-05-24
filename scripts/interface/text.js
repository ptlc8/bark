"use strict";
// public
var InterfaceText = (function() {
    class InterfaceText extends InterfaceComponent {
		constructor(text, font, size = 0.1, color = [1, 1, 1, 1]) {
			super();
			this.text = text;
			this.font = font;
			this.size = size;
			this.color = color;
		}
		click(x, y, click) {
		}
		draw(renderer, x, y, width) {
			renderer.drawText(this.text, this.font, x, y + 0.1 * this.size, this.size * 0.8, this.color, "center", "center");
		}
		getHeight() {
			return this.size;
		}
	}
    
    return InterfaceText;
})();