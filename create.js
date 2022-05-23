var model = {voxels:[{pos:[0,0,0],scale:[1,1,1],color:[1,1,1,1],name:"voxel",rotation:[0,0,0],origin:[0,0,0]}]};
var editingVoxelIndex = [0];
var editingAnimName = "";
var editingAnimMoveProp = "x";
function getVoxel(index, m=model) {
    if (index.length==0) return m;
    else return getVoxel(index.slice(1, index.length), m.voxels[index[0]]);
}
function refreshHierarchy(model) {
    var f = function(div, model, index=[]) {
        var childrenDiv = document.createElement("div");
        let i = 0;
        if (model.voxels)
            for (let voxel of model.voxels) {
                let finalI = i;
                var nameSpan = document.createElement("span");
                nameSpan.innerText = voxel.name;
                childrenDiv.appendChild(nameSpan);
                if (editingVoxelIndex.join(" ")==index.concat(finalI).join(" "))
                    nameSpan.className = "selected";
                nameSpan.addEventListener("click", function(e) {
                    editingVoxelIndex = index.concat(finalI);
                    refreshEditor();
                });
                f(childrenDiv, voxel, index.concat([i]));
                i++;
            }
        div.appendChild(childrenDiv);
    }
    var hierarchyDiv = document.getElementById("hierarchy");
    hierarchyDiv.innerHTML = "";
    f(hierarchyDiv, model);
    
}
function refreshEditor() {
    /*var voxelsSelect = document.getElementById("voxels");
    voxelsSelect.innerHTML = "";
    for (const [i,voxel] of Object.entries(model.voxels)) {
        let o = document.createElement("option");
        o.innerText = voxel.name;
        o.value = i;
        voxelsSelect.appendChild(o);
    }*/
    refreshHierarchy(model);
    refreshVoxelEditor();
}
function colorToHex(color) {
    if (!color || color.length<3)
        return undefined;
    return "#" + ((1 << 24) + (parseInt(color[0]*255) << 16) + (parseInt(color[1]*255) << 8) + parseInt(color[2]*255)).toString(16).slice(1);
}
function refreshVoxelEditor() {
    let voxel = getVoxel(editingVoxelIndex);
    document.getElementById("name").value = voxel.name;
    document.getElementById("color").value = colorToHex(voxel.color);
    document.getElementById("x").value = voxel.pos[0];
    document.getElementById("y").value = voxel.pos[1];
    document.getElementById("z").value = voxel.pos[2];
    document.getElementById("sx").value = voxel.scale[0];
    document.getElementById("sy").value = voxel.scale[1];
    document.getElementById("sz").value = voxel.scale[2];
    document.getElementById("ox").value = voxel.origin[0];
    document.getElementById("oy").value = voxel.origin[1];
    document.getElementById("oz").value = voxel.origin[2];
    document.getElementById("rx").value = voxel.rotation[0];
    document.getElementById("ry").value = voxel.rotation[1];
    document.getElementById("rz").value = voxel.rotation[2];
    for (let i = 0; i < 6; i++)
        document.getElementById("color"+i).value = colorToHex(voxel.colors?(voxel.colors[i]||[]):voxel.color);
    refreshAnimsSelector();
}
function increment(input, value=1) {
    input.value = parseFloat(input.value)+value;
    input.dispatchEvent(new Event("change"));
}
function decrement(input, value=1) {
    input.value = parseFloat(input.value)-value;
    input.dispatchEvent(new Event("change"));
}
function hexToColor(hex) {
    if (!hex)
        return undefined;
    return [Math.floor(new Number("0x"+hex.slice(1,3))/255*1000)/1000, Math.floor(new Number("0x"+hex.slice(3,5))/255*1000)/1000, Math.floor(new Number("0x"+hex.slice(5,7))/255*1000)/1000, 1];
}
function refreshVoxel() {
    let voxel = getVoxel(editingVoxelIndex);
    let data = {};
    for (let id of ["name","color","x","y","z","sx","sy","sz","ox","oy","oz","rx","ry","rz"])
        data[id] = document.getElementById(id).value;
    voxel.name = data.name;
    voxel.color = hexToColor(data.color);
    voxel.pos[0] = parseFloat(data.x);
    voxel.pos[1] = parseFloat(data.y);
    voxel.pos[2] = parseFloat(data.z);
    voxel.scale[0] = parseFloat(data.sx);
    voxel.scale[1] = parseFloat(data.sy);
    voxel.scale[2] = parseFloat(data.sz);
    voxel.origin[0] = parseFloat(data.ox);
    voxel.origin[1] = parseFloat(data.oy);
    voxel.origin[2] = parseFloat(data.oz);
    voxel.rotation[0] = parseFloat(data.rx);
    voxel.rotation[1] = parseFloat(data.ry);
    voxel.rotation[2] = parseFloat(data.rz);
    if (!voxel.colors) voxel.colors = [];
    for (let i = 0; i < 6; i++)
        voxel.colors[i] = hexToColor(document.getElementById("color"+i).value);
}
function refreshVoxelAnim() {
    let anims = getVoxel(editingVoxelIndex).anims;
    let newAnimName = document.getElementById("anim-name").value;
    if (editingAnimName != newAnimName) {
        if (!anims[newAnimName]) {
            anims[newAnimName] = anims[editingAnimName];
            delete anims[editingAnimName];
            editingAnimName = newAnimName;
        }
        else alert("Ce nom d'animation est déjà utilisé sur ce voxel");
    }
    let anim = anims[editingAnimName][editingAnimMoveProp];
    if (!anim) return;
    anim.d = parseInt(document.getElementById("anim-duration").value);
    let i = 0;
    for (let keyframeDiv of document.getElementById("anim-moves").children) {
        anim.kf[i].t = parseInt(keyframeDiv.getElementsByClassName("t")[0].value);
        anim.kf[i].v = parseFloat(keyframeDiv.getElementsByClassName("value")[0].value);
        anim.kf[i].f = keyframeDiv.getElementsByClassName("function")[0].value;
        i++;
    }
}
function addGlobalVoxel() {
    model.voxels.push({pos:[0,0,0],scale:[1,1,1],color:[1,1,1,1],name:"nouveau",rotation:[0,0,0],origin:[0,0,0]});
    editingVoxelIndex = [model.voxels.length-1];
    refreshEditor();
    refreshVoxelEditor();
}
function addSiblingVoxel() {
    let parentVoxel = getVoxel(editingVoxelIndex.slice(0, editingVoxelIndex.length-1));
    parentVoxel.voxels.push({pos:[0,0,0],scale:[1,1,1],color:[1,1,1,1],name:"nouveau",rotation:[0,0,0],origin:[0,0,0]});
    editingVoxelIndex[editingVoxelIndex.length-1] = parentVoxel.voxels.length-1;
    refreshEditor();
    refreshVoxelEditor();
}
function addChildVoxel() {
    let parentVoxel = getVoxel(editingVoxelIndex);
    if (!parentVoxel.voxels) parentVoxel.voxels = [];
    parentVoxel.voxels.push({pos:[0,0,0],scale:[1,1,1],color:[1,1,1,1],name:"nouveau",rotation:[0,0,0],origin:[0,0,0]});
    editingVoxelIndex.push(parentVoxel.voxels.length-1);
    refreshEditor();
    refreshVoxelEditor();
}
function copyVoxel() {
    let parentVoxel = getVoxel(editingVoxelIndex.slice(0, editingVoxelIndex.length-1));
    let copy = JSON.parse(JSON.stringify(getVoxel(editingVoxelIndex)));
    copy.name += " (copie)"
    parentVoxel.voxels.push(copy);
    editingVoxelIndex[editingVoxelIndex.length-1] = parentVoxel.voxels.length-1;
    refreshEditor();
}
function deleteVoxel() {
    getVoxel(editingVoxelIndex.slice(0,editingVoxelIndex.length-1)).voxels.splice(editingVoxelIndex[editingVoxelIndex.length-1], 1);
    editingVoxelIndex = [0];
    refreshEditor();
}
function getAnimsNames(model) {
	let animsNames = [];
	if (model.anims)
		for (let animName of Object.keys(model.anims))
		    for (let subAnimName of animName.split("|"))
			    if (!animsNames.includes(subAnimName))
			        animsNames.push(subAnimName);
	if (model.voxels)
    	for (let voxel of model.voxels)
    		for (animName of getAnimsNames(voxel))
    			if (!animsNames.includes(animName))
    			    animsNames.push(animName);
	return animsNames;
}
function refreshAnimsSelector() {
    var animsSelect = document.getElementById("anim-select");
    animsSelect.innerHTML = "";
    let voxel = getVoxel(editingVoxelIndex);
    if (!voxel.anims || Object.keys(voxel.anims).length==0) {
        let o = document.createElement("option");
        o.innerText = "Aucune animation sur ce voxel";
        o.value = "";
        o.disabled = o.selected = true;
        animsSelect.appendChild(o);
        editingAnimName = "";
    } else {
        for (let animName in voxel.anims) {
            let o = document.createElement("option");
            o.innerText = animName;
            o.value = animName;
            animsSelect.appendChild(o);
        }
        if (editingAnimName=="")
            editingAnimName = Object.keys(voxel.anims)[0];
        animsSelect.value = editingAnimName;
    }
    refreshAnimEditor();
}
function refreshAnimEditor() {
    dummyEntity.setAnim(editingAnimName);
    document.getElementById("anim-name").value = editingAnimName;
    document.getElementById("anim-name").disabled = editingAnimName=="";
    refreshAnimMoves();
}
function refreshAnimMoves() {
    var voxel = getVoxel(editingVoxelIndex);
    if (editingAnimName!="" && voxel.anims && voxel.anims[editingAnimName]) {
        display("anim");
        
        //editingAnimMoveProp
        refreshKeyframesEditor();
    } else {
        hide("anim");
        document.getElementById("anim-moves").innerHTML = "";
    }
}
function refreshKeyframesEditor() {
    var voxel = getVoxel(editingVoxelIndex);
    var movesDiv = document.getElementById("anim-moves");
    movesDiv.innerHTML = "";
    if (voxel.anims[editingAnimName][editingAnimMoveProp]) {
        document.getElementById("anim-duration").value = voxel.anims[editingAnimName][editingAnimMoveProp].d;
        let i = 0;
        for (let keyframe of voxel.anims[editingAnimName][editingAnimMoveProp].kf) {
            let finalI = i;
            var fSelect;
            var keyframeDiv = createElement("div", {className:"flex"}, [
                createElement("input", {className:"t", type:"number", min:0, max:100, placeholder:"Progression", value:keyframe.t}, [], {change:refreshVoxelAnim}),
                createElement("span", {className:"unit"}, "%"),
                createElement("input", {className:"value flex2", type:"number", placeholder:"Valeur", value:keyframe.v}, [], {change:refreshVoxelAnim}),
                fSelect = createElement("select", {className:"function flex2"}, Object.entries(EasingFunctions.namesFR).map(f=>createElement("option", {value:f[0]}, f[1])), {change:refreshVoxelAnim}),
                createElement("div", {className:"vertical-flex"}, [
                    createElement("button", {title:"Duppliquer la valeur clé"}, "📋", {click:function() {
                        copyKeyframe(finalI);
                    }}),
                    createElement("button", {title:"Supprimer la valeur clé"}, "🗑️", {click:function() {
                        deleteKeyframe(finalI);
                    }})
                ])
            ]);
            fSelect.value = keyframe.f;
            movesDiv.appendChild(keyframeDiv);
            i++;
        }
    } else {
        document.getElementById("anim-duration").value = "";
        movesDiv.innerText = "Aucune valeur clé, animez sur cette propriété en en rajoutant une."
    }
}
function addAnim() {
    let voxel = getVoxel(editingVoxelIndex);
    if (!voxel.anims) voxel.anims = {};
    let i = 0;
    while (voxel.anims["animation "+i]) i++;
    voxel.anims["animation "+i] = {};
    editingAnimName = "animation "+i;
    refreshAnimsSelector();
}
function copyAnim() {
    if (editingAnimName=="")
        return alert("Il n'y a aucune animation à copier");
    let voxel = getVoxel(editingVoxelIndex);
    let i = "";
    while (voxel.anims[editingAnimName+" (copie"+i+")"]) i++;
    voxel.anims[editingAnimName+" (copie"+i+")"] = JSON.parse(JSON.stringify(voxel.anims[editingAnimName]));
    editingAnimName = editingAnimName+" (copie"+i+")";
    refreshAnimsSelector();
}
function deleteAnim() {
    if (editingAnimName=="")
        return alert("Il n'y a aucune animation à supprimer");
    let voxel = getVoxel(editingVoxelIndex);
    delete voxel.anims[editingAnimName]
    editingAnimName = "";
    refreshAnimsSelector();
}
function addKeyframe() {
    if (editingAnimName=="") return;
    let anim = getVoxel(editingVoxelIndex).anims[editingAnimName];
    if (!anim[editingAnimMoveProp]) anim[editingAnimMoveProp] = {d:document.getElementById("anim-duration").value||1000,kf:[]};
    anim[editingAnimMoveProp].kf.push({t:0,f:"linear",v:editingAnimMoveProp.includes("s")?1:0});
    refreshKeyframesEditor();
}
function copyKeyframe(index) {
    if (editingAnimName=="") return;
    let anim = getVoxel(editingVoxelIndex).anims[editingAnimName];
    if (!anim[editingAnimMoveProp] || !anim[editingAnimMoveProp].kf[index]);
    anim[editingAnimMoveProp].kf.push(JSON.parse(JSON.stringify(anim[editingAnimMoveProp].kf[index])));
    refreshKeyframesEditor();
}
function deleteKeyframe(index) {
    if (editingAnimName=="") return;
    let anim = getVoxel(editingVoxelIndex).anims[editingAnimName];
    if (!anim[editingAnimMoveProp] || !anim[editingAnimMoveProp].kf[index]);
    anim[editingAnimMoveProp].kf.splice(index, 1);
    if (anim[editingAnimMoveProp].kf.length==0)
        delete anim[editingAnimMoveProp];
    refreshKeyframesEditor();
}
async function pickColor(defaultColor=undefined) {
	var promise = new Promise(function(resolve,reject){
		var popup;
		document.body.appendChild(popup = createElement("div", {className:"popup-container"}, [
			createElement("div", {className:"popup"}, [
				createElement("div", {className:"flex color-picker"}, [
					createElement("label", {htmlFor:"color-picker-input", className:"flex2"}, "Sélectionner une nouvelle couleur"),
					createElement("input", {type:"color",id:"color-picker-input"}, [], {change:function(e){
						e.target.nextElementSibling.style.backgroundColor = e.target.nextElementSibling.dataset.color = e.target.value;
					}}),
					createElement("div", {className:"color",style:{backgroundColor:defaultColor},dataset:{color:defaultColor}}, [], {click:function(e) {
						var color = e.target.dataset.color;
						if (!color) return;
						resolve(color);
						document.body.removeChild(popup);
						var colors = JSON.parse(localStorage["bark.colors"]||"[]");
						if (colors.indexOf(color)!=-1)
							colors.splice(colors.indexOf(color), 1);
						colors.unshift(color);
						if (colors.length > 9*4)
							colors.splice(9*4);
						localStorage["bark.colors"] = JSON.stringify(colors);
					}})
				]),
				createElement("div", {className:"palette"}, JSON.parse(localStorage["bark.colors"]||"[]").map(function(color) {
					return createElement("div", {style:{backgroundColor:color}, dataset:{color}}, [], {click:function(e) {
						var color = e.target.dataset.color;
						resolve(color);
						document.body.removeChild(popup);
						var colors = JSON.parse(localStorage["bark.colors"]);
						colors.splice(colors.indexOf(color), 1);
						colors.unshift(color);
						localStorage["bark.colors"] = JSON.stringify(colors);
					}});
				}))
			], {click:function(e){
			    e.stopPropagation();
			}})
		], {click:function(){
			document.body.removeChild(popup);
		}}));
	});
	return promise;
}
function display(...ids) {
    for (let id of ids)
        if (document.getElementById(id))
            document.getElementById(id).style.display = "";
}
function hide(...ids) {
    for (let id of ids)
        if (document.getElementById(id))
            document.getElementById(id).style.display = "none";
}
function createElement(tag, properties={}, inner=[], eventListeners={}) {
    let el = document.createElement(tag);
    for (let p of Object.keys(properties)) if (!["style","dataset"].includes(p)) el[p] = properties[p];
    for (let a of ["style","dataset"]) if (properties[a]) for (let p of Object.keys(properties[a])) el[a][p] = properties[a][p];
    if (typeof inner == "object") for (let i of inner) el.appendChild(typeof i == "string" ? document.createTextNode(i) : i);
    else el.innerText = inner;
    for (let l of Object.keys(eventListeners)) el.addEventListener(l, eventListeners[l]);
    return el;
}
function copyJSON() {
    var inputToCopy = document.createElement("textarea");
    document.body.appendChild(inputToCopy);
    inputToCopy.value = JSON.stringify(model);
    inputToCopy.select();
    document.execCommand("copy");
    document.body.removeChild(inputToCopy);
}
function loadFromClipboard() {
    navigator.clipboard.readText().then(function(content) {
        model = JSON.parse(content); 
        refreshEditor();
    });
}
hide("colors", "anims");


var cvs = document.getElementById("aff");
var renderer = new Renderer(cvs);
var camera = new Camera([0,-0.5,-20], [0,0,0], [Math.PI/5, Math.PI/4, 0]);
document.getElementById("zoom").value = camera.position[2];

var world = new World(20);
document.getElementById("time").value = world.time;
var dummyEntity = new Entity(world, "model", [0,0,0]);
world.entities.push(dummyEntity);
world.entities.push(new Entity(world, "ground", [0,0,0]));
var groundModel = {"voxels":[{"pos":[0,0,0], "scale":[1,0,1], "colors":[null,null,[0.933, 0.858, 0.647, 1],null,null,[0.768, 0.709, 0.537, 1]]}]};

window.addEventListener("load", async function() {
    
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("from")) {
        model = await loadModelFromAssets(urlParams.get("from"));
    }

    refreshEditor();

    var last = 0;
    var frames = 0;
    var documentTitle = document.title;
    function render(now) {
        while (world.previousTick+1000/world.tps <= Date.now()) {
			world.update(1/world.tps);
			camera.update();
        }
	    
		if (now-(now%1000) > last-(last%1000)) {
		    document.title = "("+frames+" FPS) "+documentTitle;
		    frames = 0;
		}
        
        const deltaTime = now - last;
        last = now;
        renderer.drawWorld(world, {model:model,ground:groundModel}, camera, deltaTime);
        renderer.drawAxis(camera.getRot());
        frames++;
        
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});


// Déplacement de la caméra avec la souris
cvs.addEventListener("mousemove", function(e) {
    if (e.buttons%2 == 1) {
        e.target.style.cursor = "grabbing";
        camera.rot[1] += e.movementX/100;
        camera.rot[0] += e.movementY/100;
        camera.rot[0] = Math.min(Math.PI/2, Math.max(camera.rot[0], -Math.PI/2));
    } else {
        e.target.style.cursor = "";
    }
});
cvs.addEventListener("wheel", function(e) {
    camera.setDistance(Math.min(-2, Math.max(-30, camera.position[2]-e.deltaY/100)));
    document.getElementById("zoom").value = camera.position[2];
});

// Déplacement de la caméra pour les écrans tactiles
var touchX, touchY;
cvs.addEventListener("touchmove", function(e) {
    e.preventDefault();
    camera.rot[1] += (e.touches[0].clientX-touchX)/100;
    camera.rot[0] += (e.touches[0].clientY-touchY)/100;
    camera.rot[0] = Math.min(Math.PI/2, Math.max(camera.rot[0], -Math.PI/2));
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
});
cvs.addEventListener("touchstart", function(e) {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
});