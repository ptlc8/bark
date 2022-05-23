var World = function() {
    var World = function(tps, items=[]) {
        this.tps = tps;
        this.previousTick = Date.now();
        this.chunks = {};
        this.entities = [];
        this.time = parseInt(Date.now()/1000/60%(60*24)); // 0: minuit, 720: midi ; max:1440
        this.windAngle = 0; // par rapport au nord, sens trigo
        this.windSpeed = 5; // 20 km/h 
        this.items = items;
        this.driftingItems = [];
        var driftingTotalProba = 0;
        for (let item of items) {
            if (item.driftingProba != 0) {
                this.driftingItems.push([item.driftingProba,item.id]);
                driftingTotalProba += item.driftingProba;
            }
        }
        for (let drifting of this.driftingItems) {
            drifting[0] /= driftingTotalProba;
        }
    };
    
    World.prototype.getTickProgress = function() {
        return (Date.now()-this.previousTick)/(1000/this.tps);
    };
    
    // private
    World.prototype.getDriftingId = function() {
        var rdm = Math.random();
        for (let item of this.driftingItems) {
            if(item[0] > rdm)
                return item[1];
            rdm -= item[0];
        }
    };
    
    World.prototype.update = function(delta) { // delta en s
        this.previousTick += delta*1000;
        if (Math.random()<0.005) { // 1 tous les 200 ticks, soit 1 toutes les 10 secondes
            var windSin = Math.sin(this.windAngle), windCos = Math.cos(this.windAngle), a=Math.round(Math.random());
            var spawnPosX = windSin>0.72?20:windSin<-0.72?-20:!a?(windSin<0?-20:20):Math.random()*40-20;
            var spawnPosZ = windCos>0.72?20:windCos<-0.72?-20:a?(windCos<0?-20:20):Math.random()*40-20;
            this.entities.push(new DriftingEntity(this, this.getDriftingId(), [spawnPosX,0.4,spawnPosZ], undefined, 1, {minX:-20, maxX:20, minZ:-20, maxZ:20}));
        }
        for (let entity of this.entities)
            entity.update(delta);
    };
    
    World.prototype.removeEntity = function(entity) {
        this.entities.splice(this.entities.indexOf(entity), 1);
    };
    
    World.prototype.getBlock = function(x,y,z) {
        let cx = Math.floor((x+0.5)/16), cy = Math.floor((y+0.5)/16), cz = Math.floor((z+0.5)/16);
	    let chunk = ((this.chunks[cx]||{})[cy]||{})[cz];
	    if (chunk===undefined) return undefined;
	    let lx = mod(Math.round(x),16), ly = mod(Math.round(y),16), lz = mod(Math.round(z),16);
	    return ((chunk[lx]||[])[ly]||[])[lz];
    };
    
    World.prototype.getGround = function(x,y,z) { // renvoie le sol le plus proche à une distance max de ~32 mètres
        let cx = Math.floor((x+0.5)/16), cY = Math.floor((y+0.5)/16), cz = Math.floor((z+0.5)/16);
	    let lx = mod(Math.round(x),16), ly = mod(Math.floor(y),16), lz = mod(Math.round(z),16);
	    for (let cy = cY; cy>cY-3; cy--) {
	        let chunk = ((this.chunks[cx]||{})[cy]||{})[cz];
	        if (chunk===undefined) continue;
	        for (; ly>=0; ly--) {
	            if (((chunk[lx]||[])[ly]||[])[lz])
	                return cy*16+ly+0.5;
	        }
	        ly=16;
	    }
	    return undefined;
    };
    
    World.prototype.isWater = function(x,y,z) {
        return y<=0 && this.getBlock(x,y,z)===undefined;
    };
    
    World.prototype.getSunPower = function() {
        return Math.max(0, -Math.cos(this.time*Math.PI/720)*0.8+0.2);
    };
    
    World.prototype.getSunPos = function() {
        return [80*Math.sin(this.time*Math.PI/720), -80*Math.cos(this.time*Math.PI/720), 0];
    };
    
    World.prototype.getLights = function() {
        var sunPower = this.getSunPower()*0.8;
        return {
            ambientColor: [0.6,0.6,0.6],
            directionalVector: [Math.sin(this.time*Math.PI/720), -Math.cos(this.time*Math.PI/720), 0],
            directionalColor: [sunPower,sunPower,sunPower]
        };
    };
    
    World.prototype.getSkybox = function() {
        var sunPower = this.getSunPower();
        return {
            color: [Math.sqrt(sunPower)*0.4,sunPower*0.8,sunPower]
        };
    };
    
    World.prototype.getWindAngle = function() {
        return this.windAngle;
    };
    
    World.prototype.getWindSpeed = function() {
        return this.windSpeed;
    };
    
    return World;
}();

var Entity = function() {
	var Entity = function(world, modelName, pos, animName=undefined, scale=1, rot=[0,0,0]) {
		this.world = world;
		this.modelName = modelName;
		this.anim = animName;
		this.pos = pos.slice(0, 3);
		this.prevPos = pos.slice(0, 3);
		this.rot = rot.slice(0,3);
		this.prevRot = rot.slice(0,3);
		this.scale = scale;
	};
	
	Entity.prototype.update = function(delta) { // delta en s
		this.prevPos[0] = this.pos[0];
		this.prevPos[1] = this.pos[1];
		this.prevPos[2] = this.pos[2];
		this.prevRot[0] = this.rot[0];
		this.prevRot[1] = this.rot[1];
		this.prevRot[2] = this.rot[2];
	};
	
	Entity.prototype.getPos = function() {
		var p = this.world.getTickProgress();
		/*if (p>1) {
		    console.error("tickProgress="+p+" > 1, previousTick="+this.world.previousTick+", now="+Date.now()+", tps="+this.world.tps+"")
		}*/
		return [
			p*this.pos[0]+(1-p)*this.prevPos[0],
			p*this.pos[1]+(1-p)*this.prevPos[1],
			p*this.pos[2]+(1-p)*this.prevPos[2]
		];
	};
	
	Entity.prototype.setPos = function(pos, tp=false) {
		if (tp) {
			this.prevPos[0] = pos[0];
			this.prevPos[1] = pos[1];
			this.prevPos[2] = pos[2];
		}
		this.pos[0] = pos[0];
		this.pos[1] = pos[1];
		this.pos[2] = pos[2];
	};
	
	Entity.prototype.getRot = function() {
		var p = this.world.getTickProgress();
		return [
			p*this.rot[0]+(1-p)*(this.prevRot[0]+(this.rot[0]-this.prevRot[0]>Math.PI?2*Math.PI:this.rot[0]-this.prevRot[0]<-Math.PI?-2*Math.PI:0)),
			p*this.rot[1]+(1-p)*(this.prevRot[1]+(this.rot[1]-this.prevRot[1]>Math.PI?2*Math.PI:this.rot[1]-this.prevRot[1]<-Math.PI?-2*Math.PI:0)),
			p*this.rot[2]+(1-p)*(this.prevRot[2]+(this.rot[2]-this.prevRot[2]>Math.PI?2*Math.PI:this.rot[2]-this.prevRot[2]<-Math.PI?-2*Math.PI:0))
		];
	};
	
	Entity.prototype.setRot = function(rot, tp=false) {
		if (tp) {
			this.prevRot[0] = rot[0]%(2*Math.PI);
			this.prevRot[1] = rot[1]%(2*Math.PI);
			this.prevRot[2] = rot[2]%(2*Math.PI);
		}
		this.rot[0] = rot[0]%(2*Math.PI);
		this.rot[1] = rot[1]%(2*Math.PI);
		this.rot[2] = rot[2]%(2*Math.PI);
	};
	
	Entity.prototype.setAnim = function(animName) {
	    this.anim = animName;
	};
	
	Entity.prototype.getAnim = function() {
	    return this.anim;
	};
	
	return Entity;
}();

var Alive = function Alive() {
	var Alive = function(world, modelName, pos, animName, speed=2, scale=1, rot=[0,0,0]) {
		Entity.call(this, world, modelName, pos, animName, scale, rot);
		this.speed = speed;
	};
	
	// extends Entity
	Alive.prototype = Object.create(Entity.prototype);
	Alive.prototype.constructor = Alive;
	
	return Alive;
}();

var FlyingEntity = function FlyingEntity() {
	var FlyingEntity = function(world, modelName, pos, animName, scale=1, speed=2, limits={}) {
		Entity.call(this, world, modelName, pos, animName, scale, [0,0,0]);
		this.speed = speed;
		this.rot[1] = Math.random()*Math.PI*2;
		this.angularSpeed = [0,0,0];
		this.limits = {};
		this.limits.minX = limits.minX;
		this.limits.minY = limits.minY;
		this.limits.minZ = limits.minZ;
		this.limits.maxX = limits.maxX;
		this.limits.maxY = limits.maxY;
		this.limits.maxZ = limits.maxZ;
	};
	
	// extends Entity
	FlyingEntity.prototype = Object.create(Entity.prototype);
	FlyingEntity.prototype.constructor = FlyingEntity;
	
	FlyingEntity.prototype.update = function(delta) { // delta en s
	    this.__proto__.__proto__.update.apply(this, [delta]);
	    /*this.prevPos[0] = this.pos[0];
		this.prevPos[1] = this.pos[1];
		this.prevPos[2] = this.pos[2];
		this.prevRot[0] = this.rot[0];
		this.prevRot[1] = this.rot[1];
		this.prevRot[2] = this.rot[2];*/
		this.angularSpeed[1] += (Math.random()*2-1)*Math.PI/4;
		this.angularSpeed[0] += (Math.random()*2-1)*Math.PI/2;
		this.angularSpeed[1] = Math.max(-0.8, Math.min(0.8, this.angularSpeed[1]));
		this.angularSpeed[0] = Math.max(-0.8, Math.min(0.8, this.angularSpeed[0]));
		this.rot[1] = mod(this.rot[1] + this.angularSpeed[1]*delta, 2*Math.PI, true);
		this.rot[0] = Math.max(-Math.PI/4, Math.min(Math.PI/4, this.rot[0] + this.angularSpeed[0]*delta));
		this.pos[0] += Math.sin(this.rot[1])*this.speed*delta*Math.cos(this.rot[0]);
		this.pos[2] += Math.cos(this.rot[1])*this.speed*delta*Math.cos(this.rot[0]);
		this.pos[1] += -Math.sin(this.rot[0])*this.speed*delta;
		if (this.pos[0]>this.limits.maxX && this.rot[1]>0)
		    this.rot[1] *= -1;
		if (this.pos[0]<this.limits.minX && this.rot[1]<0)
		    this.rot[1] *= -1;
		if (this.pos[2]>this.limits.maxZ && this.rot[1]<Math.PI/2 && this.rot[1]>-Math.PI/2)
		    this.rot[1] = mod(-this.rot[1]+Math.PI, 2*Math.PI, true);
		if (this.pos[2]<this.limits.minZ && (this.rot[1]>Math.PI/2 || this.rot[1]<-Math.PI/2))
		    this.rot[1] = mod(-this.rot[1]+Math.PI, 2*Math.PI, true);
		if (this.pos[1]>this.limits.maxY && this.rot[0]<0)
		    this.rot[0] *= -1;
		if (this.pos[1]<this.limits.minY && this.rot[0]>0)
		    this.rot[0] *= -1;
	};
	
	return FlyingEntity;
}();

var DriftingEntity = function() {
	var DriftingEntity = function(world, itemId, pos, animName, scale=1, limits={}) {
		Entity.call(this, world, itemId, pos, animName, scale, [0,0,0]);
		this.itemId = itemId;
		this.rot[1] = Math.random()*Math.PI*2;
		this.limits = {};
		this.limits.minX = limits.minX;
		this.limits.minZ = limits.minZ;
		this.limits.maxX = limits.maxX;
		this.limits.maxZ = limits.maxZ;
	};
	
	// extends Entity
	DriftingEntity.prototype = Object.create(Entity.prototype);
	DriftingEntity.prototype.constructor = FlyingEntity;
	
	DriftingEntity.prototype.update = function(delta) { // delta en s
	    this.__proto__.__proto__.update.apply(this, [delta]); // super.update()
	    var windAngle = this.world.getWindAngle();
	    var windSpeed = this.world.getWindSpeed();
	    this.pos[0] -= Math.sin(windAngle)*windSpeed/10*delta;
	    this.pos[2] -= Math.cos(windAngle)*windSpeed/10*delta;
	    if (this.limits.minX>this.pos[0] || this.pos[0]>this.limits.maxX || this.limits.minZ>this.pos[2] || this.pos[2]>this.limits.maxZ) {
	        this.world.removeEntity(this);
	    }
	};
	
	return DriftingEntity;
}();

var Item = function() {
    var Item = function(id, driftingProba=0) {
        this.id = id;
        this.driftingProba = driftingProba;
    };
    
    return Item;
}();

// static
function mod(a,b,around0=false) {
    if (around0)
        return (a%b+b/2)%b-b/2;
    return (a%b+b)%b;
}

var Inventory = function() {
    var Inventory = function(size=16, stackSize=16) {
        this.items = [];
        this.size = size;
        this.stackSize = stackSize;
    };
    
    Inventory.prototype.add = function(id, amount=1) { // return : nombre d'items en trop
        for (let i = 0; i < this.size; i++) {
            if (amount == 0)
                return 0;
            if (!this.items[i]) {
                this.items[i] = {id:id, amount:Math.min(amount, this.stackSize)};
                amount -= Math.min(amount, this.stackSize);
            } else if (this.items[i].id == id) {
                let a = amount
                amount -= Math.min(amount, this.stackSize-this.items[i].amount);
                this.items[i].amount += Math.min(a, this.stackSize-this.items[i].amount);
            }
        }
        return amount;
    };
    
    Inventory.prototype.count = function(id) {
        var count = 0;
        for (let item of this.items) {
            if (item)
                count += item.amount;
        }
        return count;
    };
    
    Inventory.prototype.has = function(id, amount=1) {
        return this.count(id) >= amount;
    };
    
    Inventory.prototype.remove = function(id, amount=1) { // return : nombre de non retirés
        for (let i = this.size-1; i >= 0; i--) {
            if (amount == 0)
                return 0;
            if (this.items[i] && this.items[i].id == id) {
                if (this.items[i].amount <= amount) {
                    amount -= this.items[i].amount;
                    this.items[i] = undefined;
                } else {
                    this.items[i].amount -= amount;
                    amount = 0;
                }
            }
        }
        return amount;
    };
    
    Inventory.prototype[Symbol.iterator] = function*() {
        for (let i = 0; i < this.size; i++)
            yield this.items[i];
    };
    
    Inventory.prototype.iterator = function() {
        return function*() {
            for (let i = 0; i < this.size; i++)
                yield this.items[i];
        };
    };
    
    return Inventory;
}();
