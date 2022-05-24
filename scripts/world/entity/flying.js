"use strict";
var FlyingEntity = (function FlyingEntity() {
	class FlyingEntity extends Entity {
		constructor(world, modelName, pos, animName, scale = 1, speed = 2, limits = {}) {
			super(world, modelName, pos, animName, scale, [0, 0, 0]);
			this.speed = speed;
			this.rot[1] = Math.random() * Math.PI * 2;
			this.angularSpeed = [0, 0, 0];
			this.limits = {};
			this.limits.minX = limits.minX;
			this.limits.minY = limits.minY;
			this.limits.minZ = limits.minZ;
			this.limits.maxX = limits.maxX;
			this.limits.maxY = limits.maxY;
			this.limits.maxZ = limits.maxZ;
		}
		update(delta) {
			super.update(delta);
			/*this.prevPos[0] = this.pos[0];
			this.prevPos[1] = this.pos[1];
			this.prevPos[2] = this.pos[2];
			this.prevRot[0] = this.rot[0];
			this.prevRot[1] = this.rot[1];
			this.prevRot[2] = this.rot[2];*/
			this.angularSpeed[1] += (Math.random() * 2 - 1) * Math.PI / 4;
			this.angularSpeed[0] += (Math.random() * 2 - 1) * Math.PI / 2;
			this.angularSpeed[1] = Math.max(-0.8, Math.min(0.8, this.angularSpeed[1]));
			this.angularSpeed[0] = Math.max(-0.8, Math.min(0.8, this.angularSpeed[0]));
			this.rot[1] = mod(this.rot[1] + this.angularSpeed[1] * delta, 2 * Math.PI, true);
			this.rot[0] = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.rot[0] + this.angularSpeed[0] * delta));
			this.pos[0] += Math.sin(this.rot[1]) * this.speed * delta * Math.cos(this.rot[0]);
			this.pos[2] += Math.cos(this.rot[1]) * this.speed * delta * Math.cos(this.rot[0]);
			this.pos[1] += -Math.sin(this.rot[0]) * this.speed * delta;
			if (this.pos[0] > this.limits.maxX && this.rot[1] > 0)
				this.rot[1] *= -1;
			if (this.pos[0] < this.limits.minX && this.rot[1] < 0)
				this.rot[1] *= -1;
			if (this.pos[2] > this.limits.maxZ && this.rot[1] < Math.PI / 2 && this.rot[1] > -Math.PI / 2)
				this.rot[1] = mod(-this.rot[1] + Math.PI, 2 * Math.PI, true);
			if (this.pos[2] < this.limits.minZ && (this.rot[1] > Math.PI / 2 || this.rot[1] < -Math.PI / 2))
				this.rot[1] = mod(-this.rot[1] + Math.PI, 2 * Math.PI, true);
			if (this.pos[1] > this.limits.maxY && this.rot[0] < 0)
				this.rot[0] *= -1;
			if (this.pos[1] < this.limits.minY && this.rot[0] > 0)
				this.rot[0] *= -1;
		}
	}
	
	return FlyingEntity;
})();