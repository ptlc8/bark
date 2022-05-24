"use strict";
var Entity = (function() {
	class Entity {
        constructor(world, modelName, pos, animName = undefined, scale = 1, rot = [0, 0, 0]) {
            this.world = world;
            this.modelName = modelName;
            this.anim = animName;
            this.pos = pos.slice(0, 3);
            this.prevPos = pos.slice(0, 3);
            this.rot = rot.slice(0, 3);
            this.prevRot = rot.slice(0, 3);
            this.scale = scale;
        }
        update(delta) {
            this.prevPos[0] = this.pos[0];
            this.prevPos[1] = this.pos[1];
            this.prevPos[2] = this.pos[2];
            this.prevRot[0] = this.rot[0];
            this.prevRot[1] = this.rot[1];
            this.prevRot[2] = this.rot[2];
        }
        getPos() {
            var p = this.world.getTickProgress();
            /*if (p>1) {
                console.error("tickProgress="+p+" > 1, previousTick="+this.world.previousTick+", now="+Date.now()+", tps="+this.world.tps+"")
            }*/
            return [
                p * this.pos[0] + (1 - p) * this.prevPos[0],
                p * this.pos[1] + (1 - p) * this.prevPos[1],
                p * this.pos[2] + (1 - p) * this.prevPos[2]
            ];
        }
        setPos(pos, tp = false) {
            if (tp) {
                this.prevPos[0] = pos[0];
                this.prevPos[1] = pos[1];
                this.prevPos[2] = pos[2];
            }
            this.pos[0] = pos[0];
            this.pos[1] = pos[1];
            this.pos[2] = pos[2];
        }
        getRot() {
            var p = this.world.getTickProgress();
            return [
                p * this.rot[0] + (1 - p) * (this.prevRot[0] + (this.rot[0] - this.prevRot[0] > Math.PI ? 2 * Math.PI : this.rot[0] - this.prevRot[0] < -Math.PI ? -2 * Math.PI : 0)),
                p * this.rot[1] + (1 - p) * (this.prevRot[1] + (this.rot[1] - this.prevRot[1] > Math.PI ? 2 * Math.PI : this.rot[1] - this.prevRot[1] < -Math.PI ? -2 * Math.PI : 0)),
                p * this.rot[2] + (1 - p) * (this.prevRot[2] + (this.rot[2] - this.prevRot[2] > Math.PI ? 2 * Math.PI : this.rot[2] - this.prevRot[2] < -Math.PI ? -2 * Math.PI : 0))
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
        setAnim(animName) {
            this.anim = animName;
        }
        getAnim() {
            return this.anim;
        }
    }
    
	return Entity;
})();