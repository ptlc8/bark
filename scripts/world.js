"use strict";
var World = (function() {
    class World {
        constructor(tps, driftingItems = []) {
            this.tps = tps;
            this.previousTick = Date.now();
            this.chunks = {};
            this.entities = [];
            this.time = parseInt(Date.now() / 1000 / 60 % (60 * 24)); // 0: minuit, 720: midi ; max:1440
            this.windAngle = 0; // par rapport au nord, sens trigo
            this.windSpeed = 5; // 20 km/h 
            this.driftingItems = driftingItems;
        }
        getTickProgress() {
            return (Date.now() - this.previousTick) / (1000 / this.tps);
        }
        // private
        getDriftingId() {
            var rdm = Math.random();
            for (let item of this.driftingItems) {
                if (item[0] > rdm)
                    return item[1];
                rdm -= item[0];
            }
        }
        update(delta) {
            this.previousTick += delta * 1000;
            if (Math.random() < 0.005) { // 1 tous les 200 ticks, soit 1 toutes les 10 secondes
                var windSin = Math.sin(this.windAngle), windCos = Math.cos(this.windAngle), a = Math.round(Math.random());
                var spawnPosX = windSin > 0.72 ? 20 : windSin < -0.72 ? -20 : !a ? (windSin < 0 ? -20 : 20) : Math.random() * 40 - 20;
                var spawnPosZ = windCos > 0.72 ? 20 : windCos < -0.72 ? -20 : a ? (windCos < 0 ? -20 : 20) : Math.random() * 40 - 20;
                this.entities.unshift(new DriftingEntity(this, this.getDriftingId(), [spawnPosX, 0.4, spawnPosZ], undefined, 1, { minX: -20, maxX: 20, minZ: -20, maxZ: 20 }));
            }
            for (let entity of this.entities)
                entity.update(delta);
        }
        removeEntity(entity) {
            this.entities.splice(this.entities.indexOf(entity), 1);
        }
        getBlock(x, y, z) {
            let cx = Math.floor((x + 0.5) / 16), cy = Math.floor((y + 0.5) / 16), cz = Math.floor((z + 0.5) / 16);
            let chunk = ((this.chunks[cx] || {})[cy] || {})[cz];
            if (chunk === undefined)
                return undefined;
            let lx = mod(Math.round(x), 16), ly = mod(Math.round(y), 16), lz = mod(Math.round(z), 16);
            return ((chunk[lx] || [])[ly] || [])[lz];
        }
        getGround(x, y, z) {
            let cx = Math.floor((x + 0.5) / 16), cY = Math.floor((y + 0.5) / 16), cz = Math.floor((z + 0.5) / 16);
            let lx = mod(Math.round(x), 16), ly = mod(Math.floor(y), 16), lz = mod(Math.round(z), 16);
            for (let cy = cY; cy > cY - 3; cy--) {
                let chunk = ((this.chunks[cx] || {})[cy] || {})[cz];
                if (chunk === undefined)
                    continue;
                for (; ly >= 0; ly--) {
                    if (((chunk[lx] || [])[ly] || [])[lz])
                        return cy * 16 + ly + 0.5;
                }
                ly = 16;
            }
            return undefined;
        }
        isWater(x, y, z) {
            return y <= 0 && this.getBlock(x, y, z) === undefined;
        }
        getSunPower() {
            return Math.max(0, -Math.cos(this.time * Math.PI / 720) * 0.8 + 0.2);
        }
        getSunPos() {
            return [80 * Math.sin(this.time * Math.PI / 720), -80 * Math.cos(this.time * Math.PI / 720), 0];
        }
        getLights() {
            var sunPower = this.getSunPower() * 0.8;
            return {
                ambientColor: [0.6, 0.6, 0.6],
                directionalVector: [Math.sin(this.time * Math.PI / 720), -Math.cos(this.time * Math.PI / 720), 0],
                directionalColor: [sunPower, sunPower, sunPower]
            };
        }
        getSkybox() {
            var sunPower = this.getSunPower();
            return {
                color: [Math.sqrt(sunPower) * 0.4, sunPower * 0.8, sunPower]
            };
        }
        getWindAngle() {
            return this.windAngle;
        }
        getWindSpeed() {
            return this.windSpeed;
        }
    }
    
    return World;
})();

// static
function mod(a,b,around0=false) {
    if (around0)
        return (a%b+b/2)%b-b/2;
    return (a%b+b)%b;
}