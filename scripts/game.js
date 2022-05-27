"use strict";
var Game = (function(){
	class Game {
		constructor() {
			this.world = null;
            this.player = null;
            this.sun = null;
            this.items = {};
            this.inventory = new Inventory(24,16);
            this.crafts = [];
		}
        registerItem(item) {
            if (this.items[item.id])
                console.error("Cet item est déjà enregistré : "+item.id);
			else
                this.items[item.id] = item;
		}
        registerCraft(craft) {
            this.crafts.push(craft);
		}
		start() {
            var driftingItems = []
            var driftingTotalProba = 0;
            for (const [itemId,item] of Object.entries(this.items)) {
                if (item.driftingProba != 0) {
                    driftingItems.push([item.driftingProba, itemId]);
                    driftingTotalProba += item.driftingProba;
                }
            }
            for (let drifting of driftingItems) {
                drifting[0] /= driftingTotalProba;
            }
            this.world = new World(20, driftingItems);
			this.world.chunks = {0:{0:{0:[[["boards","boards","boards","cube","boards","boards","boards","boards","boards","boards","boards","boards","boards","boards","boards","boards"],["cube"]],[["boards",undefined,"boards"]]]}}}
            this.player = new Alive(this.world, "cat", [0,1.5,0], 2);
            this.world.entities.push(this.player);
            for (let i = 0; i < 3; i++)
                this.world.entities.push(new FlyingEntity(this.world, "sardine", [0,-1,0], "swim", 1, 6, {minX:-20, maxX:20, minY:-9.5, maxY:.2, minZ:-20, maxZ:20}));
            this.world.entities.push(new FlyingEntity(this.world, "bee", [0,2,0], "fly", 1, 2, {minX:-20, maxX:20, minY:0.5, maxY:4, minZ:-20, maxZ:20}));
            this.world.entities.push(new DriftingEntity(this.world, "plank", [4,0.4,1], undefined, 1, {minX:-20, maxX:20, minZ:-20, maxZ:20}));
            this.world.entities.push(new Entity(this.world, "ground", [0,-10,0]));
            this.sun = new Entity(this.world, "sun", [50,0,0]);
            this.world.entities.push(this.sun);
            this.world.entities.push(new Entity(this.world, "sea", [0,0,0]));
		}
        update(delta) {
            this.world.update(delta);
            this.sun.setPos(this.world.getSunPos());
            
    	    var groundHeight = this.world.getGround(...this.player.pos);
    	    if (this.world.isWater(...this.player.pos)) { // nage
    	        if (this.player.pos[1]<-0) this.player.pos[1] = 0; // ~~~
    	    } else if (groundHeight===undefined || groundHeight<this.player.pos[1]) {
    	        this.player.pos[1] -= .1*20*delta;
    	    } else if (groundHeight>this.player.pos[1]) {
    	        this.player.pos[1] = groundHeight;
    	    }
		}
        action() {
            for (let entity of this.world.entities) {
                if (entity instanceof DriftingEntity && Math.sqrt(Math.pow(entity.pos[0]-this.player.pos[0],2)+Math.pow(entity.pos[1]-this.player.pos[1],2)+Math.pow(entity.pos[2]-this.player.pos[2],2)) < 1) {
                    this.world.removeEntity(entity);
                    this.inventory.add(entity.itemId, 1);
                    return;
                }
            }
            console.log(this.inventory.getSelectedItemId());
		}
        special() {
            
		}
        jump() {
            var groundY = this.world.getGround(...this.player.pos);
            if (groundY && groundY==this.player.pos[1])
                this.player.pos[1]++;  
		}
        move(delta, x, z, run=false, cameraRot=0) {
            var inWater = this.world.isWater(...this.player.pos);
        	this.player.rot[1] = (Math.atan2(x, z)-cameraRot);
        	let dx = Math.sin(this.player.rot[1])*this.player.speed*delta*(run&&!inWater?1.5:1);
        	let dz = Math.cos(this.player.rot[1])*this.player.speed*delta*(run&&!inWater?1.5:1);
        	if (this.world.getBlock(this.player.pos[0]+dx, this.player.pos[1]+0.6, this.player.pos[2])!==undefined)
        		dx = 0;
        	if (this.world.getBlock(this.player.pos[0], this.player.pos[1]+0.6, this.player.pos[2]+dz)!==undefined)
        		dz = 0;
        	if (dx!==0 || dz!==0) {
            	this.player.pos[0] += dx;
        		this.player.pos[2] += dz;
        		this.player.setAnim(inWater?"swim":run?"run":"walk");
        	} else {
        		this.player.setAnim(this.world.isWater(...this.player.pos)?"idle-swim":"idle");
        	}
        }
        // deprecated
        dontmove() {
            this.player.setAnim(this.world.isWater(...this.player.pos)?"idle-swim":"idle");  
		}
	}

	return Game;
}());