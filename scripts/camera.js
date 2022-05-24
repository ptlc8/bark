"use strict";
// public
var Camera = (function() {
	class Camera {
		constructor(position, targetPos = [0, 0, 0], rot = [0, 0, 0]) {
			this.target = targetPos.slice(0, 3);
			this.rot = rot.slice(0, 3);
			this.prevRot = rot.slice(0, 3);
			this.position = position.slice(0, 3); // par rapport à target
			this.prevPosition = position.slice(0, 3);
		}
		getViewMatrix(tickProgress = 1) {
			var vMatrix = mat4.create();
			var rot = this.getRot(tickProgress);
			mat4.translate(vMatrix, vMatrix, this.getPosition(tickProgress));
			mat4.rotate(vMatrix, vMatrix, rot[0], [1, 0, 0]);
			mat4.rotate(vMatrix, vMatrix, rot[1], [0, 1, 0]);
			mat4.rotate(vMatrix, vMatrix, rot[2], [0, 0, 1]);
			mat4.translate(vMatrix, vMatrix, [-this.target[0], -this.target[1], -this.target[2]]);
			return vMatrix;
		}
		setTargetPos(targetPos) {
			this.target = targetPos;
		}
		update() {
			this.prevRot[0] = this.rot[0];
			this.prevRot[1] = this.rot[1];
			this.prevRot[2] = this.rot[2];
			this.prevPosition[0] = this.position[0];
			this.prevPosition[1] = this.position[1];
			this.prevPosition[2] = this.position[2];
		}
		getRot(tickProgress = 1) {
			return [
				tickProgress * this.rot[0] + (1 - tickProgress) * (this.prevRot[0] + (this.rot[0] - this.prevRot[0] > Math.PI ? 2 * Math.PI : this.rot[0] - this.prevRot[0] < -Math.PI ? -2 * Math.PI : 0)),
				tickProgress * this.rot[1] + (1 - tickProgress) * (this.prevRot[1] + (this.rot[1] - this.prevRot[1] > Math.PI ? 2 * Math.PI : this.rot[1] - this.prevRot[1] < -Math.PI ? -2 * Math.PI : 0)),
				tickProgress * this.rot[2] + (1 - tickProgress) * (this.prevRot[2] + (this.rot[2] - this.prevRot[2] > Math.PI ? 2 * Math.PI : this.rot[2] - this.prevRot[2] < -Math.PI ? -2 * Math.PI : 0))
			];
		}
		setRot(rot, tp = false) {
			if (tp) {
				this.prevRot[0] = rot[0] % (2 * Math.PI);
				this.prevRot[1] = rot[1] % (2 * Math.PI);
				this.prevRot[2] = rot[2] % (2 * Math.PI);
			}
			this.rot[0] = rot[0] % (2 * Math.PI);
			this.rot[1] = rot[1] % (2 * Math.PI);
			this.rot[2] = rot[2] % (2 * Math.PI);
		}
		getPosition(tickProgress = 1) {
			return [
				tickProgress * this.position[0] + (1 - tickProgress) * this.prevPosition[0],
				tickProgress * this.position[1] + (1 - tickProgress) * this.prevPosition[1],
				tickProgress * this.position[2] + (1 - tickProgress) * this.prevPosition[2]
			];
		}
		setDistance(distance, tp = false) {
			if (tp) {
				this.prevPosition[2] = distance;
			}
			this.position[2] = distance;
		}
	}
	
	return Camera;
})();