"use strict";
// public
var InterfaceModelView = (function() {
    class InterfaceModelView extends InterfaceComponent {
		constructor(model, amount, font, size = 0.1, color = [1, 1, 1, 0.1], textColor = [1, 1, 1, 1]) {
			super();
			this.model = model;
			this.amount = amount;
			this.font = font;
			this.size = size;
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
			renderer.drawInterfaceQuad(x, y, this.model ? width : width / 2, this.model ? this.size : this.size / 2, this.color);
			if (this.model)
				renderer.drawModel(this.model, x, y, width * 0.5, [Math.PI / 4, Math.PI / 5, Math.PI / 6], 0);
			if (this.amount && this.amount!=1)
				renderer.drawText(this.amount, this.font, x+0.45*width, y-0.45*this.size, Math.min(width*0.4, 0.1), this.textColor, "right", "bottom");
		}
		getHeight() {
			return this.size;
		}
	}
    
    return InterfaceModelView;
})();