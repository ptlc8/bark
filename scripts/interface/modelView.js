"use strict";
// public
var InterfaceModelView = (function() {
    class InterfaceModelView extends InterfaceComponent {
		constructor(model, font, size = 0.1, color = [1, 1, 1, 0.1], textColor = [1, 1, 1, 1]) {
			super();
			this.model = model;
			this.font = font;
			this.size = size;
			this.color = color;
			this.textColor = textColor;
			this.onclick = undefined;
		}
		setOnClick(onclick) {
			this.onclick = onclick;
		}
		click(x, y, click) {
			if (this.onclick)
				this.onclick();
		}
		draw(renderer, x, y, width) {
			renderer.drawInterfaceQuad(x, y, this.model ? width : width / 2, this.model ? this.size : this.size / 2, this.color);
			if (this.model)
				renderer.drawModel(this.model, x, y, width * 0.5, [Math.PI / 4, Math.PI / 5, Math.PI / 6], 0);
			//renderer.drawText(this.text, this.font, x, y+0.1*this.height, this.height*0.8, this.textColor, "center", "center");
		}
		getHeight() {
			return this.size;
		}
	}
    
    return InterfaceModelView;
})();