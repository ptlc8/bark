"use strict";
var Alive = (function Alive() {
	class Alive extends Entity {
        constructor(world, modelName, pos, animName, speed = 2, scale = 1, rot = [0, 0, 0]) {
            super(world, modelName, pos, animName, scale, rot);
            this.speed = speed;
        }
    }
	
	return Alive;
})();