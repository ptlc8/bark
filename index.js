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
    	cube: {voxels:[{pos:[0,0,0],scale:[1,1,1],color:[1,1,1,1],rotation:[0,0,0],origin:[0,0,0]}], scale:1},
    	sea: {"voxels":[{"pos":[0,.4,0], "scale":[200,0,200], "colors":[null,null,[0,.4,.9,.7],null,null,[0,.4,.9,.7]]}]},
    	ground: {"voxels":[{"pos":[0,0,0], "scale":[200,0.1,200], "colors":[null,null,[0.933, 0.858, 0.647, 1],null,null,[0.768, 0.709, 0.537, 1]]}]},
    	sun: {"voxels":[{"pos":[0,0,0], "scale":[2,2,2], "color":[1,1,.4,1]}]}
    };
    for (let modelName of ["sardine","bee","boards","plank","stonks","cat","bottle","box"]) {
        models[modelName] = await loadModelFromAssets(modelName);
        //loadModelFromAssets(modelName).then(model => models[modelName] = model);
    }
    // Création de la partie/monde
    var game = new Game();
    game.registerItem(new Item("plank", "Planche", 8));
    game.registerItem(new Item("bottle", "Bouteille", 1));
    game.registerItem(new Item("box", "Boîte", 1));
    game.registerItem(new Item("boards", "Planches", 0));
    game.registerCraft(new Craft("boards", 1, {"plank":4}));
    game.registerCraft(new Craft("box", 1, {"plank":24}));
    game.registerCraft(new Craft("bottle", 24, {"bottle":24,"box":12,plank:1}));
    game.start();
    // Gestion des inputs
    var keys = [
        ["KeyW","-directionZ"],["ArrowUp","-directionZ"], ["KeyS","+directionZ"],["ArrowDown","+directionZ"], ["GamepadAxe1","directionZ"],
        ["KeyA","-directionX"],["ArrowLeft","-directionX"], ["KeyD","+directionX"],["ArrowRight","+directionX"], ["GamepadAxe0","directionX"],
        ["GamepadAxe2","cameraRotateY"],["MouseGrabMoveX","cameraRotateY"],
        ["GamepadAxe3","cameraRotateX"],["MouseGrabMoveY","cameraRotateX"],
        ["GamepadButton0","special"],["KeyQ","special"],
        ["GamepadButton1","action"],["KeyC","action"],
        ["GamepadButton2","inventory"],["KeyE","inventory"],
        ["GamepadButton3","craft"],["KeyR","craft"],
        ["GamepadButton4","zoomin"],["Equal","zoomin"],
        ["GamepadButton5","zoomout"],["Minus","zoomout"],
        ["GamepadButton6","run"],["ShiftLeft","run"],
        ["GamepadButton7","jump"],["Space","jump"],
        ["GamepadButton9","menu"],["Escape","menu"],
        ["MouseButton0","grab"]
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
            return true;
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
            let i = 0;
            for (let item of game.inventory) {
                let slotView = new InterfaceModelView(item?models[item.id]:undefined, item?item.amount:0, fonts.Arial, 0.1);
                let index = i;
                slotView.setOnAction(function(){
                    game.inventory.select(index);
                    interfaceRoot.close();
                    return true;
                });
                inv.add(slotView);
                i++;
            }
        });
        // Crafting
        var preview, craftModelView, craftItemName, recipeDiv, craftingsDiv;
        var crafting = new InterfaceGrid(2, 1);
        crafting.setVisible(false);
        crafting.add(preview = new InterfaceDiv());
        preview.add(craftModelView = new InterfaceModelView(undefined, 0, fonts.Arial, 0.5));
        preview.add(craftItemName = new InterfaceText("", fonts.Arial, 0.1, [0,0,0,1]));
        preview.add(recipeDiv = new InterfaceDiv());
        preview.add(new InterfaceText("Y/C : Fabriquer   B/A : Retour", fonts.Arial, 0.05));
        crafting.add(craftingsDiv = new InterfaceDiv());
        interfaceRoot.register("crafting", crafting);
        crafting.setOnRefresh(function() {
            craftingsDiv.components = [];
            for (let craft of game.crafts) {
                let craftButton = new InterfaceButton(game.items[craft.resultItemId].name, fonts.Arial, 0.05, [.4,.4,.4,.8]);
                craftButton.setOnAction(function(){
                    var result = game.inventory.craft(craft);
                    updateCraftView(craftingsDiv.selectedComponent);
                    return result;
                });
                craftingsDiv.add(craftButton);
            }
        });
        craftingsDiv.setOnSelect(updateCraftView);
        function updateCraftView(index) {
            let craft = game.crafts[index];
            craftModelView.model = models[craft.resultItemId];
            craftModelView.amount = craft.resultAmount;
            craftItemName.text = game.items[craft.resultItemId].name;
            recipeDiv.components = [];
            for (const [id,amount] of Object.entries(craft.ingredients)) {
                recipeDiv.add(new InterfaceText(game.items[id].name+" x"+amount, fonts.Arial, 0.05, game.inventory.has(id,amount)?[0,1,0,1]:[1,0,0,1]));
			}
        }
    }
    
    // Fonction d'avancement du jeu
    function update(delta) { // delta en s
        game.update(delta);
        camera.update();
        var inputs = inputsManager.getInputs();
        if (interfaceRoot.isFocus())  {
            if (inputs.directionZ.value<0 && inputs.directionZ.clicked)
                interfaceRoot.previous();
            if (inputs.directionZ.value>0 && inputs.directionZ.clicked)
                interfaceRoot.next();
            if (inputs.action.clicked) {
                interfaceRoot.action(0) && InputsManager.vibrate(80, 1, 0.5);
            }
            if (inputs.special.clicked)
                interfaceRoot.back();
            if (inputs.directionX.value<0 && inputs.directionX.clicked)
                interfaceRoot.previousCol();
            if (inputs.directionX.value>0 && inputs.directionX.clicked)
                interfaceRoot.nextCol();
            if (inputs.menu.clicked) {
                interfaceRoot.close();
                InputsManager.vibrate(80, 1, 0.5);
            }
        } else {
            camera.rot[0] = Math.min(Math.PI/2, Math.max(-Math.PI/2, camera.rot[0]+inputs.cameraRotateX.value*delta*2));
            camera.rot[1] += inputs.cameraRotateY.value*delta*4;
            cvs.style.cursor = inputs.grab.pressed ? "grabbing" : "grab";
            if (inputs.zoomout.pressed) // dézoom
                camera.setDistance(Math.max(-35, camera.position[2]-1));
            if (inputs.zoomin.pressed) // zoom
                camera.setDistance(Math.min(-5, camera.position[2]+1));
            if (inputs.action.clicked) { // action
                game.action() && InputsManager.vibrate(80, 1, 0.5);
            }
            if (inputs.special.clicked) { // special
                game.special() && InputsManager.vibrate(80, 1, 0.5);
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
                game.jump() && InputsManager.vibrate(80, 1, 0.5);
            }
        	if (inputs.directionX.value!=0 || inputs.directionZ.value!=0) {
        	    game.move(delta, inputs.directionX.value, inputs.directionZ.value, inputs.run.pressed, camera.rot[1]);
        	} else {
        	    game.dontmove();
        	}
        }
    }
    
    // fonction de rendu
	var last = 0;
	var fps;
	var frames = 0;
	function render(now) {
	    while (game.world.previousTick+1000/game.world.tps <= Date.now())
			update(1/game.world.tps);
		if (now-(now%1000) > last-(last%1000)) {
		    fps = frames;
		    frames = 0;
		    document.title = fps+" FPS";
		}
		frames++;
		const deltaTime = now - last;
		last = now;
		camera.setTargetPos(game.player.getPos());
		renderer.drawWorld(game.world, models, camera, deltaTime);
        interfaceRoot.draw(renderer, 0, 0, 1);
		renderer.drawText(game.player.pos.map(n=>new Number(n).toFixed(3)).join(" ; "), fonts.Arial, -1, 1, .05, [1,1,1,1], "left", "top");
		renderer.drawText(fps+" fps", fonts.Arial, -1, 0.95, .05, [1,1,1,1], "left", "top");
		
		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);

    return game;
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