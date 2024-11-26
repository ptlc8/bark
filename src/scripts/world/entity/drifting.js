"use strict";
var DriftingEntity = (function() {
	class DriftingEntity extends Entity {
		constructor(world, itemId, pos, animName, scale = 1, limits = {}) {
			super(world, itemId, pos, animName, scale, [0, 0, 0]);
			this.itemId = itemId;
			this.rot[1] = Math.random() * Math.PI * 2;
			this.limits = {};
			this.limits.minX = limits.minX;
			this.limits.minZ = limits.minZ;
			this.limits.maxX = limits.maxX;
			this.limits.maxZ = limits.maxZ;
		}
		update(delta) {
			super.update(delta);
			var windAngle = this.world.getWindAngle();
			var windSpeed = this.world.getWindSpeed();
			this.pos[0] -= Math.sin(windAngle) * windSpeed / 10 * delta;
			this.pos[2] -= Math.cos(windAngle) * windSpeed / 10 * delta;
			if (this.limits.minX > this.pos[0] || this.pos[0] > this.limits.maxX || this.limits.minZ > this.pos[2] || this.pos[2] > this.limits.maxZ) {
				this.world.removeEntity(this);
			}
		}
	}

	return DriftingEntity;
})();