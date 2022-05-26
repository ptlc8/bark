"use strict";
// public
var InterfaceButton = (function() {
    class InterfaceButton extends InterfaceComponent {
		constructor(text, font, height = 0.1, color = [1, 0, 0, 1], textColor = [1, 1, 1, 1]) {
			super();
			this.text = text;
			this.font = font;
			this.height = height;
			this.color = color;
			this.textColor = textColor;
			this.onAction = undefined;
		}
		setOnAction(onAction) {
			this.onAction = onAction;
		}
		action(x, y, click) {
			if (this.onAction)
				this.onAction();
		}
		draw(renderer, x, y, width) {
			if (this.color)
				renderer.drawInterfaceQuad(x, y, width, this.height, this.color);
			renderer.drawText(this.text, this.font, x, y + 0.1 * this.height, this.height * 0.8, this.textColor, "center", "center");
		}
		getHeight() {
			return this.height;
		}
	}
    
    return InterfaceButton;
})();