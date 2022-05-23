Renderer = function() {
	// private static final
	const vertexShaderSource = `
	  #define PI 3.1415926538
	  
	  attribute highp vec3 aVertexPosition;
	  attribute mediump vec4 aVertexColor;
	  attribute highp vec3 aVertexNormal;
	  attribute highp mat4 aVertexTransform;
	
	  uniform highp mat4 uViewMatrix;
	  uniform highp mat4 uCameraMatrix;
	  uniform highp mat4 uProjectionMatrix;
	  uniform mediump vec3 uAmbientLight;
	  
	  varying mediump vec4 vColor;
	  varying highp vec3 vLighting;
	  
	  void main() {
		gl_Position = uProjectionMatrix * uViewMatrix * uCameraMatrix * aVertexTransform * (vec4(aVertexPosition, 1.0));
		vColor = aVertexColor;
		
		// lighting effect
		//highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);
		highp vec3 directionalLightColor = vec3(0.75, 0.75, 0.75);
		highp vec3 directionalVector = vec3(0.5, 0.7, 0.5);
		
		highp float directional = max(0.0, dot(normalize((aVertexTransform * vec4(aVertexNormal, 0.0)).xyz), directionalVector));
		vLighting = uAmbientLight + (directionalLightColor * directional);
	  }
	`;
	
	// private static final
	const fragShaderSource = `
	  varying mediump vec4 vColor;
	  varying highp vec3 vLighting;
	  
	  void main() {
		gl_FragColor = vec4(vColor.xyz*vLighting, vColor.w);
	  }
	`;
	
	// private static // Crée un shader du type fourni, charge la source et le compile
	function loadShader(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}
	
	// private static // Initialiser un programme shader
	function initShaderProgram(gl, vsSource, fsSource) {
		const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
		const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert('Impossible d\'initialiser le programme shader : ' + gl.getProgramInfoLog(shaderProgram));
			return null;
		}
		return shaderProgram;
	}
	
	function Renderer(cvs, debug=false){
		cvs.width = cvs.clientWidth;
		cvs.height = cvs.clientHeight;
		this.gl = cvs.getContext("webgl");
		if (!this.gl)
			alert("WebGL non supporté :(")
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);
		this.gl.enable(this.gl.BLEND);
		//this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.clearDepth(1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		
		var shaderProgram = initShaderProgram(this.gl, vertexShaderSource, fragShaderSource);
		this.programInfo = {
			program: shaderProgram,
			attribLocations: {
				vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				vertexNormal: this.gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
				vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor'),
				vertexTransform: this.gl.getAttribLocation(shaderProgram, 'aVertexTransform')
			},
			uniformLocations: {
				projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				cameraMatrix: this.gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
				viewMatrix: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
				ambientLight: this.gl.getUniformLocation(shaderProgram, 'uAmbientLight'),
			}
		};
		this.debug = debug;
	}
	
	Renderer.prototype.drawBuffers = function(buffers, camera) {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		
		// Matrice de perspective
		const fieldOfView = 45 * Math.PI / 180;   // en radians
		const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
		const zNear = 0.1;
		const zFar = 100.0;
		const projectionMatrix = mat4.create();
		mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
		
		// Définir la position de dessin comme étant le point "origine", qui est le centre de la scène
		const viewMatrix = mat4.create();
		mat4.translate(viewMatrix, viewMatrix, [-0.0, -0.0, -20.0]);
		
		// matrice de rotation de la camera autour du centre
		var cameraMatrix = camera.getViewMatrix();
		
		// Indiquer quels indices utiliser pour indexer les sommets, couleurs, normales et autres
		const indexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffers.indices), this.gl.STATIC_DRAW);
		
		// Indiquer les sommets pour les mettre dans l'attribut vertexPosition
		const verticesBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.vertices), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
		
		// Indiquer les couleurs pour les mettre dans l'attribut vertexColor
		const colorBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.colors), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
		
		// Indiquer les normales
		const normalBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.normals), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexNormal, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexNormal);
		
		// Indiquer les transformations
		for (let i = 0; i < 4; i++) {
			const transformBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, transformBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.transforms.filter((t,ndx)=>parseInt(ndx/4)%4==i)), this.gl.STATIC_DRAW);
			this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexTransform+i, 4, this.gl.FLOAT, false, 0, 0);
			this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexTransform+i);
		}
		
		// Indiquer le programme pour dessiner
		this.gl.useProgram(this.programInfo.program);
		
		// Définir les uniformes du shader
		this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
		this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.cameraMatrix, false, cameraMatrix);
		this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.viewMatrix, false, viewMatrix);
		this.gl.uniform3fv(this.programInfo.uniformLocations.ambientLight, [.6,.6,.6]);
		
		this.gl.drawElements(this.gl.TRIANGLES, buffers.indices.length, this.gl.UNSIGNED_SHORT, 0);
	}
	
	// private static
	function calcAnimValue(keyframes, duration, start=0, debug=false) {
		var t = (Date.now()-start)%duration/duration*100; // progression en %
		var startT = 0, startValue = 0, endT = undefined, endValue = 0, func = "linear";
		for (let keyframe of keyframes) {
			if (keyframe.t<t && keyframe.t>=startT) {
				startT = keyframe.t;
				startValue = keyframe.v;
				func = keyframe.f;
			}
			if (keyframe.t>t && (!endT || keyframe.t<=endT)) {
				endT = keyframe.t;
				endValue = keyframe.v;
			}
			if (keyframe.t==t)
			    return keyframe.v;
		}
		if (endT===undefined) {
			endT = 100;
			endValue = keyframes[0].v;
		}
		if (debug) console.log({t,startT,startValue,endT,endValue,func})
	    return startValue+(EasingFunctions[func]||EasingFunctions.linear)((t-startT)/(endT-startT))*(endValue-startValue);
	}
	window.calcAnimValue = calcAnimValue
	// private static
	function calcAnim(model, anim=undefined, start=0) {
		var a = {pos:[0,0,0],scale:[1,1,1],origin:[0,0,0],rot:[0,0,0]};
		if (anim && model.anims && model.anims[anim]) {
			if (model.anims[anim].x)
				a.pos[0] = calcAnimValue(model.anims[anim].x.kf, model.anims[anim].x.d, start);
			if (model.anims[anim].y)
				a.pos[1] = calcAnimValue(model.anims[anim].y.kf, model.anims[anim].y.d, start);
			if (model.anims[anim].z)
				a.pos[2] = calcAnimValue(model.anims[anim].z.kf, model.anims[anim].z.d, start);
			if (model.anims[anim].sx)
				a.scale[0] = calcAnimValue(model.anims[anim].sx.kf, model.anims[anim].sx.d, start);
			if (model.anims[anim].sy)
				a.scale[1] = calcAnimValue(model.anims[anim].sy.kf, model.anims[anim].sy.d, start);
			if (model.anims[anim].sz)
				a.scale[2] = calcAnimValue(model.anims[anim].sz.kf, model.anims[anim].sz.d, start);
			if (model.anims[anim].rx)
				a.rot[0] = calcAnimValue(model.anims[anim].rx.kf, model.anims[anim].rx.d, start);
			if (model.anims[anim].ry)
				a.rot[1] = calcAnimValue(model.anims[anim].ry.kf, model.anims[anim].ry.d, start);
			if (model.anims[anim].rz)
				a.rot[2] = calcAnimValue(model.anims[anim].rz.kf, model.anims[anim].rz.d, start);
		}
		return a;
	}
	
	// private static
	function getModelBuffers(model, transform=mat4.create(), animName=undefined) {
		var allIndices = [];
		var allVertices = [];
		var allColors = [];
		var allNormals = [];
		var allTransforms = [];
		for (let voxel of model.voxels) {
			// indexage
			const indices = [0,1,2,2,3,0, 4,5,6,6,7,4, 8,9,10,10,11,8, 12,13,14,14,15,12, 16,17,18,18,19,16, 20,21,22,22,23,20];
			const verticesIndices = [0,6,3,2, 1,5,2,3, 0,2,5,4, 1,7,4,5, 0,4,7,6, 1,3,6,7]; // z- x+ y- z+ x- y+
			const colorsIndices = [0,0,0,0, 1,1,1,1, 2,2,2,2, 3,3,3,3, 4,4,4,4, 5,5,5,5];
			const normalsIndices = [0,0,0,0, 1,1,1,1, 2,2,2,2, 3,3,3,3, 4,4,4,4, 5,5,5,5];
			// calcul des valeurs
			var anim = calcAnim(voxel, animName);
			var vertices = [[-.5,-.5,-.5], [.5,.5,.5], [.5,-.5,-.5], [.5,.5,-.5], [-.5,-.5,.5], [.5,-.5,.5], [-.5,.5,-.5], [-.5,.5,.5]];
			for (let vertex of vertices) {
				for (let i = 0; i < 3; i++)
					vertex[i] = vertex[i]*voxel.scale[i]*anim.scale[i];
			}
			var colors = voxel.colors || [voxel.color,voxel.color,voxel.color,voxel.color,voxel.color,voxel.color];
			var normals = [];
			for (let j = 0; j < verticesIndices.length; j+=4) {
				let a = vec3.create(), b = vec3.create();
				vec3.set(a, vertices[verticesIndices[j]][0] - vertices[verticesIndices[j+1]][0], vertices[verticesIndices[j]][1] - vertices[verticesIndices[j+1]][1], vertices[verticesIndices[j]][2] - vertices[verticesIndices[j+1]][2]);
				vec3.set(b, vertices[verticesIndices[j]][0] - vertices[verticesIndices[j+2]][0], vertices[verticesIndices[j]][1] - vertices[verticesIndices[j+2]][1], vertices[verticesIndices[j]][2] - vertices[verticesIndices[j+2]][2]);
				let normal = vec3.create();
				vec3.cross(normal, a, b);
				//vec3.normalize(normal, normal);
				normals.push([normal[0],normal[1],normal[2]]);
			}
			// calcul de la transformation du voxel
			vTransform = mat4.create();
			mat4.translate(vTransform, vTransform, voxel.pos);
			mat4.translate(vTransform, vTransform, anim.pos);
			if (voxel.origin)
				mat4.translate(vTransform, vTransform, voxel.origin)
			if (voxel.rotation) {
				mat4.rotateX(vTransform, vTransform, (voxel.rotation[0]+anim.rot[0])/180*Math.PI);
				mat4.rotateY(vTransform, vTransform, (voxel.rotation[1]+anim.rot[1])/180*Math.PI);
				mat4.rotateZ(vTransform, vTransform, (voxel.rotation[2]+anim.rot[2])/180*Math.PI);
			}
			if (voxel.origin) {
				let negOrigin = vec3.create();
				negOrigin[0] = -voxel.origin[0]-anim.origin[0];
				negOrigin[1] = -voxel.origin[1]-anim.origin[1];
				negOrigin[2] = -voxel.origin[2]-anim.origin[2];
				mat4.translate(vTransform, vTransform, negOrigin);
			}
			mat4.multiply(vTransform, transform, vTransform);
			
			// ajout des données aux buffers
			var lastIndex = allVertices.length/3;
			var facesIgnored = 0;
			for (let i = 0; i < 6; i++) { // for each face
				if (!colors[i] || (voxel.scale[2]===0 && i%3!=0) || (voxel.scale[0]===0 && i%3!=1) || (voxel.scale[1]===0 && i%3!=2)) {
					facesIgnored++;
					continue;
				}
				for (let j = i*6; j < i*6+6; j++)
					allIndices.push(lastIndex+indices[j]-facesIgnored*4);
				for (let j = i*4; j < i*4+4; j++) {
					allVertices = allVertices.concat(vertices[verticesIndices[j]]);
					allColors = allColors.concat(colors[colorsIndices[j]]||[0,0,0,0.5]);
					allNormals = allNormals.concat(normals[normalsIndices[j]]);
					allTransforms = allTransforms.concat(Array.from(vTransform));
				}
			}
			// rebelote pour les voxels enfants
			if (voxel.voxels) {
				let childBuffers = getModelBuffers(voxel, vTransform, animName);
				let lastIndex = allVertices.length/3;
				allIndices = allIndices.concat(childBuffers.indices.map(i=>i+lastIndex));
				allVertices = allVertices.concat(childBuffers.vertices);
				allColors = allColors.concat(childBuffers.colors);
				allNormals = allNormals.concat(childBuffers.normals);
				allTransforms = allTransforms.concat(childBuffers.transforms);
			}
		}
		return {
			indices: allIndices,
			vertices: allVertices,
			colors: allColors,
			normals: allNormals,
			transforms: allTransforms,
		};
	}
	
	Renderer.prototype.drawWorld = function(world, models, camera, deltaTime) { // deltaTime en ms mais unused
		var allIndices = [];
		var allVertices = [];
		var allColors = [];
		var allNormals = [];
		var allTransforms = [];
		for (let entity of world.entities) {
		    if (!models[entity.modelName]) continue;
			// calcul de la transformation de l'entité
			eTransform = mat4.create();
			var eRotation = entity.getRot();
			mat4.translate(eTransform, eTransform, entity.getPos());
			mat4.rotateX(eTransform, eTransform, eRotation[0]);
			mat4.rotateY(eTransform, eTransform, eRotation[1]);
			mat4.rotateZ(eTransform, eTransform, eRotation[2]);
			var eScale = (entity.scale||1) * (models[entity.modelName].scale||1);
    		mat4.scale(eTransform, eTransform, [eScale,eScale,eScale]);
			
			let modelBuffers = getModelBuffers(models[entity.modelName], eTransform, entity.getAnim());
			let lastIndex = allVertices.length/3;
			allIndices = allIndices.concat(modelBuffers.indices.map(i=>i+lastIndex));
			allVertices = allVertices.concat(modelBuffers.vertices);
			allColors = allColors.concat(modelBuffers.colors);
			allNormals = allNormals.concat(modelBuffers.normals);
			allTransforms = allTransforms.concat(modelBuffers.transforms);
			
			// pour tous les voxels du model
			/*for (let model of models[entity.modelName]) {
				// indexage
				const indices = [0,1,2,2,3,0, 4,5,6,6,7,4, 8,9,10,10,11,8, 12,13,14,14,15,12, 16,17,18,18,19,16, 20,21,22,22,23,20];
				const verticesIndices = [0,6,3,2, 1,5,2,3, 0,2,5,4, 1,7,4,5, 0,4,7,6, 1,3,6,7]; // z- x+ y- z+ x- y+
				const colorsIndices = [0,0,0,0, 1,1,1,1, 2,2,2,2, 3,3,3,3, 4,4,4,4, 5,5,5,5];
				const normalsIndices = [0,0,0,0, 1,1,1,1, 2,2,2,2, 3,3,3,3, 4,4,4,4, 5,5,5,5];
				// calcul des valeurs
				var vertices = [[-.5,-.5,-.5], [.5,.5,.5], [.5,-.5,-.5], [.5,.5,-.5], [-.5,-.5,.5], [.5,-.5,.5], [-.5,.5,-.5], [-.5,.5,.5]];
				for (let vertex of vertices) {
					for (let i = 0; i < 3; i++)
						vertex[i] = vertex[i]*model.scale[i]+model.pos[i];
				}
				var colors = model.colors || [model.color,model.color,model.color,model.color,model.color,model.color];
				var normals = [];
				for (let j = 0; j < verticesIndices.length; j+=4) {
					let a = vec3.create(), b = vec3.create();
					vec3.set(a, vertices[verticesIndices[j]][0] - vertices[verticesIndices[j+1]][0], vertices[verticesIndices[j]][1] - vertices[verticesIndices[j+1]][1], vertices[verticesIndices[j]][2] - vertices[verticesIndices[j+1]][2]);
					vec3.set(b, vertices[verticesIndices[j]][0] - vertices[verticesIndices[j+2]][0], vertices[verticesIndices[j]][1] - vertices[verticesIndices[j+2]][1], vertices[verticesIndices[j]][2] - vertices[verticesIndices[j+2]][2]);
					let normal = vec3.create();
					vec3.cross(normal, a, b);
					vec3.normalize(normal, normal);
					normals.push([normal[0],normal[1],normal[2]]);
				}
				// calcul de la transformation du voxel
				vTransform = mat4.create();
				if (model.origin)
					mat4.translate(vTransform, vTransform, model.origin)
				if (model.rotation) {
					mat4.rotateX(vTransform, vTransform, model.rotation[0]/180*Math.PI);
					mat4.rotateY(vTransform, vTransform, model.rotation[1]/180*Math.PI);
					mat4.rotateZ(vTransform, vTransform, model.rotation[2]/180*Math.PI);
				}
				if (model.origin) {
					let negOrigin = vec3.create();
					negOrigin[0] = -model.origin[0];
					negOrigin[1] = -model.origin[1];
					negOrigin[2] = -model.origin[2];
					mat4.translate(vTransform, vTransform, negOrigin);
				}
				mat4.multiply(vTransform, eTransform, vTransform);
				
				// ajout des données aux buffers
				var lastIndex = allVertices.length/3;
				var facesIgnored = 0;
				for (let i = 0; i < 6; i++) { // for each face
					if (!colors[i] || (model.scale[2]===0 && i%3!=0) || (model.scale[0]===0 && i%3!=1) || (model.scale[1]===0 && i%3!=2)) {
						facesIgnored++;
						continue;
					}
					for (let j = i*6; j < i*6+6; j++)
						allIndices.push(lastIndex+indices[j]-facesIgnored*4);
					for (let j = i*4; j < i*4+4; j++) {
						allVertices = allVertices.concat(vertices[verticesIndices[j]]);
						allColors = allColors.concat(colors[colorsIndices[j]]||[0,0,0,0.5]);
						allNormals = allNormals.concat(normals[normalsIndices[j]]);
						allTransforms = allTransforms.concat(Array.from(vTransform));
					}
				}
			}*/
		}
		if (this.debug){
			console.log("Nombre de sommets : "+allIndices.length+" (soit "+allIndices.length/3+" triangles)");
			console.log("----   INDEX	----");
			console.log(allIndices);
			console.log("----  SOMMETS   ----");
			console.log(allVertices);
			console.log("----  COULEURS  ----");
			console.log(allColors);
			console.log("----  NORMALES  ----");
			console.log(allNormals);
			console.log("---- TRANSFORMS ----");
			console.log(allTransforms);
			this.debug = false;
		}
		this.drawBuffers({
			vertices: allVertices,
			indices: allIndices,
			colors: allColors,
			normals: allNormals,
			transforms: allTransforms,
		}, camera);
	}
	
	Renderer.prototype.drawAxis = function(rotation) {
		// Initialisation du programme 
		if (!this.axisProgramInfo) {
			var vertexCode = `
			  attribute highp vec3 aVertexPosition;
			  attribute mediump vec4 aVertexColor;
			  uniform highp mat4 uMVPMatrix;
			  varying mediump vec4 vColor;
			  void main(void) {
				gl_Position = uMVPMatrix * mat4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1) * vec4(aVertexPosition, 1.0);
				vColor = aVertexColor;
			  }`;
			var fragCode = `
			  varying mediump vec4 vColor;
			  void main(void) {
				gl_FragColor = vColor;
			  }`;
			var shaderProgram = initShaderProgram(this.gl, vertexCode, fragCode);
			if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
				alert("Impossible d'initialiser le programme shader (axis) : " + this.gl.getProgramInfoLog(shaderProgram));
				return null;
			}
			this.axisProgramInfo = {
				program: shaderProgram,
				attribLocations: {
					vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
					vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor')
				},
				uniformLocations: {
					MVPMatrix: this.gl.getUniformLocation(shaderProgram, 'uMVPMatrix')
				}
			};
		}
		this.gl.useProgram(this.axisProgramInfo.program);
		// Calcul des valeurs
		var MVPMatrix = mat4.create();
		mat4.translate(MVPMatrix, MVPMatrix, [-.7, -.7, 0]);
		mat4.rotateX(MVPMatrix, MVPMatrix, -rotation[0]);
		mat4.rotateY(MVPMatrix, MVPMatrix, -rotation[1]);
		mat4.rotateZ(MVPMatrix, MVPMatrix, -rotation[2]);
		mat4.translate(MVPMatrix, MVPMatrix, [-.05, -.05, .05]);
		var vertices = [
			0,0,0, .2,0,0, .2,0,0, .15,.05,0, .2,0,0, .15,0,-.05, 
			0,0,0, 0,.2,0, 0,.2,0, .05,.15,0, 0,.2,0, 0,.15,-.05,
			0,0,0, 0,0,-.2, 0,0,-.2, .05,0,-.15, 0,0,-.2, 0,.05,-.15
		];
		var colors = [
			1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1,
			0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1,
			0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1
		];
		// Envoi des données
		this.gl.uniformMatrix4fv(this.axisProgramInfo.uniformLocations.MVPMatrix, false, MVPMatrix);
		var vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.axisProgramInfo.attribLocations.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.axisProgramInfo.attribLocations.vertexPosition);
		var colorsBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorsBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.axisProgramInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.axisProgramInfo.attribLocations.vertexColor);
		// Dessin
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.lineWidth(8)
		this.gl.drawArrays(this.gl.LINES, 0, 18);
	}
	
	return Renderer;
}();

var Camera = function() {
	var Camera = function(pos, targetPos=[0,0,0], rot=[0,0,0]) {
		this.target = targetPos.slice(0,3);
		this.rot = rot.slice(0,3);
		this.prevRot = rot.slice(0,3);
		this.pos = pos.slice(0,3); // par rapport à target
	}
	
	Camera.prototype.getViewMatrix = function() {
		var vMatrix = mat4.create();
		mat4.rotate(vMatrix, vMatrix, this.rot[0], [1, 0, 0]);
		mat4.rotate(vMatrix, vMatrix, this.rot[1], [0, 1, 0]);
		mat4.rotate(vMatrix, vMatrix, this.rot[2], [0, 0, 1]);
		mat4.translate(vMatrix, vMatrix, [-this.target[0], -this.target[1], -this.target[2]]);
		//mat4.translate(vMatrix, vMatrix, this.pos);
		return vMatrix;
	}
	
	Camera.prototype.setTargetPos = function(targetPos) {
		this.target = targetPos;
	}
	
	Camera.prototype.getRot = function(tickProgress=1) {
		return [
			tickProgress*this.rot[0]+(1-tickProgress)*(this.prevRot[0]+(this.rot[0]-this.prevRot[0]>Math.PI?2*Math.PI:this.rot[0]-this.prevRot[0]<-Math.PI?-2*Math.PI:0)),
			tickProgress*this.rot[1]+(1-tickProgress)*(this.prevRot[1]+(this.rot[1]-this.prevRot[1]>Math.PI?2*Math.PI:this.rot[1]-this.prevRot[1]<-Math.PI?-2*Math.PI:0)),
			tickProgress*this.rot[2]+(1-tickProgress)*(this.prevRot[2]+(this.rot[2]-this.prevRot[2]>Math.PI?2*Math.PI:this.rot[2]-this.prevRot[2]<-Math.PI?-2*Math.PI:0))
		];
	}
	
	Camera.prototype.setRot = function(rot, tp=false) {
		if (tp) {
			this.prevRot[0] = rot[0]%(2*Math.PI);
			this.prevRot[1] = rot[1]%(2*Math.PI);
			this.prevRot[2] = rot[2]%(2*Math.PI);
		}
		this.rot[0] = rot[0]%(2*Math.PI);
		this.rot[1] = rot[1]%(2*Math.PI);
		this.rot[2] = rot[2]%(2*Math.PI);
	}
	
	return Camera;
}();

/*
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
EasingFunctions = {
	// no easing, no acceleration
	linear: t => t,
	// accelerating from zero velocity
	easeInQuad: t => t*t,
	// decelerating to zero velocity
	easeOutQuad: t => t*(2-t),
	// acceleration until halfway, then deceleration
	easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
	// accelerating from zero velocity 
	easeInCubic: t => t*t*t,
	// decelerating to zero velocity 
	easeOutCubic: t => (--t)*t*t+1,
	// acceleration until halfway, then deceleration 
	easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
	// accelerating from zero velocity 
	easeInQuart: t => t*t*t*t,
	// decelerating to zero velocity 
	easeOutQuart: t => 1-(--t)*t*t*t,
	// acceleration until halfway, then deceleration
	easeInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
	// accelerating from zero velocity
	easeInQuint: t => t*t*t*t*t,
	// decelerating to zero velocity
	easeOutQuint: t => 1+(--t)*t*t*t*t,
	// acceleration until halfway, then deceleration 
	easeInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,
	// no easing, no acceleration, no transition
	instantaneous: t => ~~t,
	// nom des fonctions en français
	namesFR: {
	    linear: "Linéaire",
    	easeInQuad: "Accélération carrée", // quadratique
    	easeOutQuad: "Décélération carrée",
    	easeInOutQuad: "Attenuation carrée",
    	easeInCubic: "Accélération cubique",
    	easeOutCubic: "Décélération cubique",
    	easeInOutCubic: "Attenuation cubique",
    	easeInQuart: "Accélération quatrième",
    	easeOutQuart: "Décélération quatrième",
    	easeInOutQuart: "Attenuation quatrième",
    	easeInQuint: "Accélération quintessentielle",
    	easeOutQuint: "Décélération quintessentielle",
    	easeInOutQuint: "Attenuation quintessentielle",
    	instantaneous: "Instanée"
	}
}

// public static
function loadModelFromAssets(name) {
    var url = "models/"+name+".json";
    var promise = new (Promise||ES6Promise)(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                resolve(JSON.parse(this.response));
            }
        }
        xhr.send();
    });
    return promise;
}