"use strict";
var game = (async function() {
    // Affichage
    var cvs = document.getElementById("aff");
    var renderer = new Renderer(cvs, true);
    var camera = new Camera([0,-1,-10.0], [0,0,0], [Math.PI/5, Math.PI/4, 0]);
    window.addEventListener("resize", function() {
        cvs.width = cvs.clientWidth*(window.devicePixelRatio||1);
        cvs.height = cvs.clientHeight*(window.devicePixelRatio||1);
    });
    // Chargement de la police
    var fonts = [];
    fonts["Arial"] = await loadFontFromAssets("Arial");
    // Chargement des modèles
    var models = {
    	player: {voxels:[{pos:[0,0.5,0],scale:[1,1,1],color:[.8,.2,.2,1],rotation:[0,0,0],origin:[0,.5,0]}], scale:.5},
    	cube: {voxels:[{pos:[0,0,0],scale:[1,1,1],color:[1,1,1,1],rotation:[0,0,0],origin:[0,0,0]}], scale:1},
    	sea: {"voxels":[{"pos":[0,.4,0], "scale":[200,0,200], "colors":[null,null,[0,.4,.9,.7],null,null,[0,.4,.9,.7]]}]},
    	ground: {"voxels":[{"pos":[0,0,0], "scale":[200,0.1,200], "colors":[null,null,[0.933, 0.858, 0.647, 1],null,null,[0.768, 0.709, 0.537, 1]]}]},
    	sun: {"voxels":[{"pos":[0,0,0], "scale":[2,2,2], "color":[1,1,.4,1]}]}
    };
    for (let modelName of ["sardine","bee","boards","plank","stonks","cat","bottle","box"]) {
        models[modelName] = await loadModelFromAssets(modelName);
        //loadModelFromAssets(modelName).then(model => models[modelName] = model);
    }
    // Création du monde
    var world = new World(20, {plank:new Item("plank", "Planche", 8), bottle:new Item("bottle", "Bouteille", 1), box:new Item("box", "Boîte", 1), boards:new Item("boards", "Planches", 0)});
    world.chunks = {0:{0:{0:[[["boards","boards","boards","cube","boards","boards","boards","boards","boards","boards","boards","boards","boards","boards","boards","boards"],["cube"]],[["boards",undefined,"boards"]]]}}}
    var player = new Alive(world, "cat", [0,1.5,0], 2);
    world.entities.push(player);
    for (let i = 0; i < 3; i++)
        world.entities.push(new FlyingEntity(world, "sardine", [0,-1,0], "swim", 1, 6, {minX:-20, maxX:20, minY:-9.5, maxY:.2, minZ:-20, maxZ:20}));
    world.entities.push(new FlyingEntity(world, "bee", [0,2,0], "fly", 1, 2, {minX:-20, maxX:20, minY:0.5, maxY:4, minZ:-20, maxZ:20}));
    world.entities.push(new DriftingEntity(world, "plank", [4,0.4,1], undefined, 1, {minX:-20, maxX:20, minZ:-20, maxZ:20}));
    world.entities.push(new Entity(world, "ground", [0,-10,0]));
    var sun = new Entity(world, "sun", [50,0,0]);
    world.entities.push(sun);
    world.entities.push(new Entity(world, "sea", [0,0,0]));
    var inventory = new Inventory(24,16);
    inventory.add("boards", 4);
    var crafts = [
        new Craft("boards", ["plank",4]),
        new Craft("box", ["plank",24]),
    ];
    // Gestion des inputs
    var keys = [
        ["KeyW","-directionZ"],["ArrowUp","-directionZ"], ["KeyS","+directionZ"],["ArrowDown","+directionZ"], ["GamepadAxe1","directionZ"],
        ["KeyA","-directionX"],["ArrowLeft","-directionX"], ["KeyD","+directionX"],["ArrowRight","+directionX"], ["GamepadAxe0","directionX"],
        ["GamepadAxe2","cameraRotateY"],["MouseGrabMoveX","cameraRotateY"],
        ["GamepadAxe3","cameraRotateX"],["MouseGrabMoveY","cameraRotateX"],
        ["GamepadButton1","action"],["KeyC","action"],
        ["GamepadButton2","inventory"],["KeyE","inventory"],
        ["GamepadButton3","craft"],["KeyR","craft"],
        ["GamepadButton3","special"],["KeyQ","special"],
        ["GamepadButton6","run"],["ShiftLeft","run"],
        ["GamepadButton7","jump"],["Space","jump"],
        ["GamepadButton8","zoomout"],["Minus","zoomout"],
        ["GamepadButton9","zoomin"],["Equal","zoomin"],
        ["GamepadButton16","menu"],["Escape","menu"],
        ["MouseButton0","click"],
    ];
    var inputsManager = new InputsManager(keys, cvs);
    // Création des interfaces
    var interfaceRoot = new InterfaceRoot();
    window.interfaceRoot = interfaceRoot;
    {
        // Menu principal
        var menu = new InterfaceDiv();
        menu.setVisible(false);
        menu.add(new InterfaceText("Menu", fonts.Arial, 0.15));
        var fsButton = new InterfaceButton("Plein écran", fonts.Arial, 0.1, [0.5,0.7,1,1]);
        fsButton.setOnAction(function() {
            if (document.fullscreenElement)
                document.exitFullscreen();
            else cvs.requestFullscreen();
        });
        menu.add(fsButton);
        menu.add(new InterfaceButton("FPS : auto", fonts.Arial, 0.1, [1,0.2,0.2,1]));
        menu.add(new InterfaceButton("B", fonts.Arial, 0.1, [0.2,1,0.2,1]));
        menu.add(new InterfaceButton("C", fonts.Arial, 0.1, [0.2,0.2,1,1]));
        interfaceRoot.register("menu", menu);
        // Inventaire
        var inventoryDiv = new InterfaceDiv(undefined, 1);
        inventoryDiv.setVisible(false);
        var inv = new InterfaceGrid(8);
        inventoryDiv.add(new InterfaceText("Inventaire", fonts.Arial, 0.15));
        inventoryDiv.add(inv);
        inventoryDiv.add(new InterfaceText("LStick/ZQSD : Déplacer   Y/C : Selectionner   B/A : Retour", fonts.Arial, 0.05));
        interfaceRoot.register("inventory", inventoryDiv);
        inventoryDiv.setOnRefresh(function() {
            inv.components = [];
            for (let item of inventory)
                inv.add(new InterfaceModelView(item?models[item.id]:undefined, fonts.Arial, 0.1));
        });
        // Crafting
        var preview, craftModelView, craftItemName, recipeDiv, craftingsDiv;
        var crafting = new InterfaceGrid(2, 1);
        crafting.setVisible(false);
        crafting.add(preview = new InterfaceDiv());
        preview.add(craftModelView = new InterfaceModelView(models["cube"], fonts.Arial, 0.5));
        preview.add(craftItemName = new InterfaceText("Item name", fonts.Arial, 0.1, [0,0,0,1]));
        preview.add(recipeDiv = new InterfaceDiv());
        preview.add(new InterfaceText("Y/C : Fabriquer   B/A : Retour", fonts.Arial, 0.05));
        crafting.add(craftingsDiv = new InterfaceDiv());
        interfaceRoot.register("crafting", crafting);
        crafting.setOnRefresh(function() {
            craftingsDiv.components = [];
            for (let craft of crafts)
                craftingsDiv.add(new InterfaceButton(world.items[craft.id].name, fonts.Arial, 0.05, [.4,.4,.4,.8]));
        });
        craftingsDiv.setOnSelect(function(index) {
            let itemId = crafts[index].id;
            craftModelView.model = models[itemId];
            craftItemName.text = world.items[itemId].name;
        });
    }
    
    // Fonction d'avancement du jeu
    function update(delta) { // delta en s
        world.update(delta);
        camera.update();
        var inputs = inputsManager.getInputs();
        sun.setPos(world.getSunPos());
        if (interfaceRoot.isFocus())  {
            if (inputs.directionZ.value<0 && inputs.directionZ.clicked)
                interfaceRoot.previous();
            if (inputs.directionZ.value>0 && inputs.directionZ.clicked)
                interfaceRoot.next();
            if (inputs.action.clicked) {
                InputsManager.vibrate(80, 1, 0.5);
                interfaceRoot.action();
            }
            if (inputs.special.clicked)
                interfaceRoot.back();
            if (inputs.directionX.value<0 && inputs.directionX.clicked)
                interfaceRoot.previousCol();
            if (inputs.directionX.value>0 && inputs.directionX.clicked)
                interfaceRoot.nextCol();
            if (inputs.menu.clicked) {
                InputsManager.vibrate(80, 1, 0.5);
                interfaceRoot.close();
            }
        } else {
            camera.rot[0] = Math.min(Math.PI/2, Math.max(-Math.PI/2, camera.rot[0]+inputs.cameraRotateX.value*delta*2));
            camera.rot[1] += inputs.cameraRotateY.value*delta*4;
            cvs.style.cursor = inputs.click.pressed ? "grabbing" : "grab";
            if (inputs.zoomout.pressed) // dézoom
                camera.setDistance(Math.max(-35, camera.position[2]-1));
            if (inputs.zoomin.pressed) // zoom
                camera.setDistance(Math.min(-5, camera.position[2]+1));
            if (inputs.action.clicked) { // action
                InputsManager.vibrate(80, 1, 0.5);
                console.log("ACTION");
                for (let entity of world.entities) {
                    if (entity instanceof DriftingEntity && Math.sqrt(Math.pow(entity.pos[0]-player.pos[0],2)+Math.pow(entity.pos[1]-player.pos[1],2)+Math.pow(entity.pos[2]-player.pos[2],2)) < 1) {
                        world.removeEntity(entity);
                        inventory.add(entity.itemId, 1);
                        break;
                    }
                }
            }
            if (inputs.menu.clicked) { // menu
                InputsManager.vibrate(80, 1, 0.5);
                interfaceRoot.open("menu");
            }
            if (inputs.inventory.clicked) { // inventaire
                InputsManager.vibrate(80, 1, 0.5);
                interfaceRoot.open("inventory");
            }
            if (inputs.craft.clicked) { // crafting
                InputsManager.vibrate(80, 1, 0.5);
                interfaceRoot.open("crafting");
            }
            if (inputs.jump.clicked) { // saut
                InputsManager.vibrate(80, 1, 0.5);
                var groundY = world.getGround(...player.pos);
                if (groundY && groundY==player.pos[1])
                    player.pos[1]++;
            }
        	if (inputs.directionX.value!=0 || inputs.directionZ.value!=0) {
        	    var inWater = world.isWater(...player.pos);
        		player.rot[1] = (Math.atan2(inputs.directionX.value, inputs.directionZ.value)-camera.rot[1]);
        		let dx = Math.sin(player.rot[1])*player.speed*delta*(inputs.run.pressed&&!inWater?1.5:1);
        		let dz = Math.cos(player.rot[1])*player.speed*delta*(inputs.run.pressed&&!inWater?1.5:1);
        		if (world.getBlock(player.pos[0]+dx, player.pos[1]+0.6, player.pos[2])!==undefined)
        		    dx = 0;
        		if (world.getBlock(player.pos[0], player.pos[1]+0.6, player.pos[2]+dz)!==undefined)
        		    dz = 0;
        		if (dx!==0 || dz!==0) {
            		player.pos[0] += dx;
        		    player.pos[2] += dz;
        		    player.setAnim(inWater?"swim":inputs.run.pressed?"run":"walk");
        		} else {
        		    player.setAnim(world.isWater(...player.pos)?"idle-swim":"idle");
        		}
        	} else {
        	    player.setAnim(world.isWater(...player.pos)?"idle-swim":"idle");
        	}
        }
    	
    	var groundHeight = world.getGround(...player.pos);
    	if (world.isWater(...player.pos)) { // nage
    	    if (player.pos[1]<-0) player.pos[1] = 0; // ~~~
    	} else if (groundHeight===undefined || groundHeight<player.pos[1]) {
    	    player.pos[1] -= .1*20*delta;
    	} else if (groundHeight>player.pos[1]) {
    	    player.pos[1] = groundHeight;
    	}
    }
    
    // fonction de rendu
	var last = 0;
	var fps;
	var frames = 0;
	function render(now) {
	    while (world.previousTick+1000/world.tps <= Date.now())
			update(1/world.tps);
		if (now-(now%1000) > last-(last%1000)) {
		    fps = frames;
		    frames = 0;
		    document.title = fps+" FPS";
		}
		frames++;
		const deltaTime = now - last;
		last = now;
		camera.setTargetPos(player.getPos());
		renderer.drawWorld(world, models, camera, deltaTime);
        interfaceRoot.draw(renderer, 0, 0, 1);
		renderer.drawText(player.pos.map(n=>new Number(n).toFixed(3)).join(" ; "), fonts.Arial, -1, 1, .05, [1,1,1,1], "left", "top");
		renderer.drawText(fps+" fps", fonts.Arial, -1, 0.95, .05, [1,1,1,1], "left", "top");
		
		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
})();

var Random = (function() {
    class Random {
        constructor(seed = 1) {
            this.seed = 1;
        }
        next() {
            var x = Math.sin(this.seed++) * 10000;
            return x - Math.floor(x);
        }
    }
    
    return Random;
}());