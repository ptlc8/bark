// public
var Renderer = function() {
	// private static final
	const vertexShaderSource = `
	  #define PI 3.1415926538
	  #define ZM 0
	  #define XP 1
	  #define YM 2
	  #define ZP 3
	  #define XM 4
	  #define YP 5
	  
	  attribute highp vec3 aVertexPosition;
	  attribute mediump vec4 aVertexColor;
	  attribute highp vec3 aVertexNormal;
	  attribute highp mat4 aVertexTransform;
	  attribute highp vec3 aVertexScale;
	  attribute lowp float aFaceOrient;
	
	  uniform highp mat4 uViewMatrix; // unused
	  uniform highp mat4 uCameraMatrix;
	  uniform highp mat4 uProjectionMatrix;
	  uniform mediump vec3 uAmbientLight;
	  uniform mediump vec3 uDirectionalLightColor;
      uniform highp vec3 uDirectionalLightVector;
	  
	  varying mediump vec4 vColor;
	  varying highp vec3 vLighting;
	  
	  void main() {
	    highp vec3 vertexPosition = aVertexPosition;
	    if (int(aFaceOrient)==ZP) {
	        vertexPosition = mat3(-1,0,0,0,1,0,0,0,-1)*vertexPosition;
	    } else if (int(aFaceOrient)==YM) {
	        vertexPosition = mat3(1,0,0,0,0,-1,0,1,0)*vertexPosition;
	    } else if (int(aFaceOrient)==YP) {
	        vertexPosition = mat3(1,0,0,0,0,1,0,-1,0)*vertexPosition;
	    } else if (int(aFaceOrient)==XP) {
	        vertexPosition = mat3(0,0,1,0,1,0,-1,0,0)*vertexPosition;
	    } else if (int(aFaceOrient)==XM) {
	        vertexPosition = mat3(0,0,-1,0,1,0,1,0,0)*vertexPosition;
	    }
	    
	    vertexPosition.x *= aVertexScale.x;
	    vertexPosition.y *= aVertexScale.y;
	    vertexPosition.z *= aVertexScale.z;
	    
		gl_Position = uProjectionMatrix * uViewMatrix * uCameraMatrix * aVertexTransform * (vec4(vertexPosition, 1.0));
		vColor = aVertexColor;
		
		// lighting effect
		highp float directional = max(0.0, dot(normalize((aVertexTransform * vec4(aVertexNormal, 0.0)).xyz), uDirectionalLightVector));
		vLighting = uAmbientLight + (uDirectionalLightColor * directional);
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
	
	// private static // Créer un shader du type fourni, charge la source et le compile
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
		cvs.width = cvs.clientWidth*(window.devicePixelRatio||1);
		cvs.height = cvs.clientHeight*(window.devicePixelRatio||1);
		this.gl = cvs.getContext("webgl2");
		if (!this.gl)
			alert("WebGL non supporté :(");
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		//this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		//this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.clearDepth(1.0);
		this.gl.enable(this.gl.DEPTH_TEST);
		
		var shaderProgram = initShaderProgram(this.gl, vertexShaderSource, fragShaderSource);
		this.programInfo = {
			program: shaderProgram,
			attribLocations: {
				vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				vertexNormal: this.gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
				vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor'),
				vertexTransform: this.gl.getAttribLocation(shaderProgram, 'aVertexTransform'),
				faceOrient: this.gl.getAttribLocation(shaderProgram, 'aFaceOrient'),
				vertexScale: this.gl.getAttribLocation(shaderProgram, 'aVertexScale')
			},
			uniformLocations: {
				projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				cameraMatrix: this.gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
				viewMatrix: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
				ambientLight: this.gl.getUniformLocation(shaderProgram, 'uAmbientLight'),
				directionalLightColor: this.gl.getUniformLocation(shaderProgram, 'uDirectionalLightColor'),
				directionalLightVector: this.gl.getUniformLocation(shaderProgram, 'uDirectionalLightVector')
			}
		};
		this.debug = debug;
		this.fonts = [];
	}
	
	Renderer.prototype.clear = function() {
	    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	};
	
	Renderer.prototype.drawVoxels = function(buffers, projectionMatrix, viewMatrix, tickProgress, lights={ambientColor:[0.6,0.6,0.6],directionalVector:[0.5,0.7,0.5],directionalColor:[0.75,0.75,0.75]}, skybox=undefined) {
	    if (skybox) {
    	    this.gl.clearColor(skybox.color[0], skybox.color[1], skybox.color[2], 1.0);
    		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	    }
		this.gl.depthFunc(this.gl.LEQUAL);
		
		// Indiquer quels indices utiliser pour indexer les sommets, couleurs, normales et autres
		const indexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		//this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffers.indices), this.gl.STATIC_DRAW);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), this.gl.STATIC_DRAW);
		
		// Indiquer les sommets pour les mettre dans l'attribut vertexPosition
		const verticesBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
		//this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.vertices), this.gl.STATIC_DRAW);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-0.5,-0.5,-0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5, 0.5,-0.5,-0.5]), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
		
		// Indiquer les couleurs pour les mettre dans l'attribut vertexColor
		const colorBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.colors), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.vertexAttribDivisor(this.programInfo.attribLocations.vertexColor, 1);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
		
		// Indiquer les normales
		const normalBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.normals), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexNormal, 3, this.gl.FLOAT, false, 0, 0);
	    this.gl.vertexAttribDivisor(this.programInfo.attribLocations.vertexNormal, 1);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexNormal);
		
		const orientBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, orientBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Uint8Array(buffers.orients), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.faceOrient, 1, this.gl.BYTE, false, 0, 0);
		this.gl.vertexAttribDivisor(this.programInfo.attribLocations.faceOrient, 1);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.faceOrient);
		
		const scaleBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, scaleBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.scales), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexScale, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.vertexAttribDivisor(this.programInfo.attribLocations.vertexScale, 6);
		this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexScale);
		
		// Indiquer les transformations
		for (let i = 0; i < 4; i++) {
			const transformBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, transformBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(buffers.transforms.map((t)=>t.slice(i*4,i*4+4)).flat()), this.gl.STATIC_DRAW);
			this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexTransform+i, 4, this.gl.FLOAT, false, 0, 0);
    		this.gl.vertexAttribDivisor(this.programInfo.attribLocations.vertexTransform+i, 6);
			this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexTransform+i);
		}
		
		// Indiquer le programme pour dessiner
		this.gl.useProgram(this.programInfo.program);
		
		// Définir les uniformes du shader
		this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
		this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.cameraMatrix, false, mat4.create());
		this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.viewMatrix, false, viewMatrix);
		this.gl.uniform3fv(this.programInfo.uniformLocations.ambientLight, lights.ambientColor);
		this.gl.uniform3fv(this.programInfo.uniformLocations.directionalLightColor, lights.directionalColor);
		this.gl.uniform3fv(this.programInfo.uniformLocations.directionalLightVector, lights.directionalVector);
		
		/*let i = 0;
		let facesIndex = 0;
		for (let facesNumber of buffers.facesNumbers) {
		    this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.transformMatrix, false, buffers.transforms[i]);
    		this.gl.drawElements(this.gl.TRIANGLES, facesNumber*6, this.gl.UNSIGNED_SHORT, facesIndex);
    		facesIndex += facesNumber*6*2;
    		i++;
		}*/
		this.gl.drawElementsInstanced(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0, buffers.colors.length/4);
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
	function getModelBuffers(buffers, model, transform=mat4.create(), animName=undefined) {
		//var allIndices = [];
		//var allVertices = [];
		var allColors = buffers.allColors;
		var allNormals = buffers.allNormals;
		var allTransforms = buffers.allTransforms;
		var allOrients = buffers.allOrients;
		var allScales = buffers.allScales;
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
				normals.push([normal[0],normal[1],normal[2]]);
			}
			// calcul de la transformation du voxel
			vTransform = mat4.create();
			mat4.translate(vTransform, vTransform, voxel.pos);
			mat4.translate(vTransform, vTransform, anim.pos);
			if (voxel.origin)
				mat4.translate(vTransform, vTransform, voxel.origin)
			if (voxel.rotation) {
				mat4.rotateZ(vTransform, vTransform, (voxel.rotation[2]+anim.rot[2])/180*Math.PI);
				mat4.rotateY(vTransform, vTransform, (voxel.rotation[1]+anim.rot[1])/180*Math.PI);
				mat4.rotateX(vTransform, vTransform, (voxel.rotation[0]+anim.rot[0])/180*Math.PI);
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
			var facesIgnored = 0;
			for (let i = 0; i < 6; i++) { // for each face
				if (!colors[i] || (voxel.scale[2]===0 && i%3!=0) || (voxel.scale[0]===0 && i%3!=1) || (voxel.scale[1]===0 && i%3!=2)) {
					//facesIgnored++;
					//continue;
				}
				allColors.push(...(colors[colorsIndices[i*4]]||[0,0,0,0]));
				allNormals.push(...normals[normalsIndices[i*4]]);
			}
    		allOrients.push(0,1,2,3,4,5);
    		allScales.push(voxel.scale[0]*anim.scale[0], voxel.scale[1]*anim.scale[1], voxel.scale[2]*anim.scale[2]);
			allTransforms.push(Array.from(vTransform));
			// rebelote pour les voxels enfants
			if (voxel.voxels) {
				getModelBuffers(buffers, voxel, vTransform, animName);
			}
		}
	}
	
	Renderer.prototype.drawWorld = function(world, models, camera, deltaTime) { // deltaTime en ms mais unused
		var allColors = [];
		var allNormals = [];
		var allTransforms = [];
		var allOrients = [];
		var allScales = [];
		for (let cx in world.chunks) if (-5<cx && cx<5) // TODO: render chunk distance
		    for (let cy in world.chunks[cx]) if (-5<cy && cy<5)
		        for (let cz in world.chunks[cx][cy]) if (-5<cz && cz<5) {
		            var chunk = world.chunks[cx][cz][cz];
		            for (let x in chunk) for (let y in chunk[x]) for (let z in chunk[x][y]) {
		                if (chunk[x][y][z]!==undefined) {
		                    if (!models[chunk[x][y][z]]) continue;
		                    let bTransform = mat4.create();
		                    mat4.translate(bTransform, bTransform, [cx*16+x*1,cy*16+y*1,cz*16+z*1]);
		                    var bScale = models[chunk[x][y][z]].scale||1;
		                    mat4.scale(bTransform, bTransform, [bScale,bScale,bScale]);
		                    getModelBuffers({allColors, allNormals, allTransforms, allOrients, allScales}, models[chunk[x][y][z]], bTransform, undefined);
		                }
		            }
		}
		for (let entity of world.entities) {
		    if (!models[entity.modelName]) continue;
			// calcul de la transformation de l'entité
			let eTransform = mat4.create();
			var eRotation = entity.getRot();
			mat4.translate(eTransform, eTransform, entity.getPos());
			mat4.rotateZ(eTransform, eTransform, eRotation[2]);
			mat4.rotateY(eTransform, eTransform, eRotation[1]);
			mat4.rotateX(eTransform, eTransform, eRotation[0]);
			var eScale = (entity.scale||1) * (models[entity.modelName].scale||1);
    		mat4.scale(eTransform, eTransform, [eScale,eScale,eScale]);
			
			getModelBuffers({allColors, allNormals, allTransforms, allOrients, allScales}, models[entity.modelName], eTransform, entity.getAnim());
		}
		
		if (this.debug){
			console.log("----  COULEURS  ----");
			console.log(allColors);
			console.log("----  NORMALES  ----");
			console.log(allNormals);
			console.log("---- TRANSFORMS ----");
			console.log(allTransforms);
			console.log("----  ORIENTS   ----");
			console.log(allOrients);
			console.log("----   SCALES   ----");
			console.log(allScales);
			this.debug = false;
		}
		
		// Matrice de perspective
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 45 * Math.PI / 180, this.gl.canvas.clientWidth / this.gl.canvas.clientHeight, 0.1, 100.0);
		
		this.drawVoxels({
			colors: allColors,
			normals: allNormals,
			transforms: allTransforms,
			orients: allOrients,
			scales: allScales
		}, projectionMatrix, camera.getViewMatrix(world.getTickProgress()), world.getTickProgress(), world.getLights(), world.getSkybox());
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
		this.gl.vertexAttribDivisor(this.axisProgramInfo.attribLocations.vertexColor, 0);
		this.gl.enableVertexAttribArray(this.axisProgramInfo.attribLocations.vertexColor);
		// Dessin
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.lineWidth(8)
		this.gl.drawArrays(this.gl.LINES, 0, 18);
	}
	
	Renderer.prototype.drawText = function(text, font, x, y, size=10, color=[1,1,1,1], hAlign="center", vAlign="center") {
	    if (!font) return console.error("undefined font");
		// Initialisation du programme 
		if (!this.textProgramInfo) {
			var vertexCode = `
			  attribute highp vec4 aVertexPosition;
			  uniform highp float uAspectRatio;
			  varying highp vec2 vAtlasCoords;
			  void main(void) {
			    vAtlasCoords = aVertexPosition.zw;
				gl_Position = vec4(aVertexPosition.x*uAspectRatio, aVertexPosition.y, 0.0, 1.0);
			  }`;
			var fragCode = `
			  uniform sampler2D uAtlas;
			  uniform mediump vec4 uTextColor;
			  varying highp vec2 vAtlasCoords;
			  void main(void) {
				mediump vec4 texelColor = texture2D(uAtlas, vAtlasCoords);
				texelColor.a = texelColor.r*uTextColor.a;
				texelColor.rgb = uTextColor.rgb;
				gl_FragColor = texelColor;
			  }`;
			var shaderProgram = initShaderProgram(this.gl, vertexCode, fragCode);
			if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
				alert("Impossible d'initialiser le programme shader (axis) : " + this.gl.getProgramInfoLog(shaderProgram));
				return null;
			}
			this.textProgramInfo = {
				program: shaderProgram,
				attribLocations: {
					vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				},
				uniformLocations: {
					textColor: this.gl.getUniformLocation(shaderProgram, 'uTextColor'),
					atlas: this.gl.getUniformLocation(shaderProgram, 'uAtlas'),
					aspectRatio: this.gl.getUniformLocation(shaderProgram, 'uAspectRatio')
				}
			};
		}
		// Initialisation de la police
		if (!this.fonts[font.name]) {
		    let atlas = this.gl.createTexture();
		    this.gl.bindTexture(this.gl.TEXTURE_2D, atlas);
		    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE); // ?
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE); // ?
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR); // ? NEAREST
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR); // ? NEAREST
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, font.width, font.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
            var atlasImage = new Image();
            atlasImage.onload = () => {
                this.gl.bindTexture(this.gl.TEXTURE_2D, atlas);
                this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, 1);
                this.gl.pixelStorei(this.gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this.gl.NONE);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, atlasImage);
            }
            atlasImage.src = "fonts/"+font.name+".png";
            this.fonts[font.name] = atlas;
		}
		this.gl.useProgram(this.textProgramInfo.program);
		// Calcul de la largeur du texte et des alignements
		var s = size/font.size;
		var r = this.gl.canvas.clientHeight/this.gl.canvas.clientWidth;
		var totalAdvance = 0;
		for (let c of text+"")
            totalAdvance += font.characters[c].advance;
        totalAdvance *= s*r;
		if (hAlign == "center")
		    x -= totalAdvance/2;
		else if (hAlign == "right")
		    x -= totalAdvance;
		if (vAlign == "center")
		    y -= size/2;
		else if (vAlign == "top")
		    y -= size;
		// Calcul des valeurs
		var vertices = []; // xyuv
		for (let c of text+"") {
		    c = font.characters[c];
		    vertices.push(x-c.originX*s*r, y+c.originY*s);
		    vertices.push(c.x/font.width, c.y/font.height);
		    vertices.push(x-c.originX*s*r, y+c.originY*s-c.height*s);
		    vertices.push(c.x/font.width, (c.y+c.height)/font.height);
		    vertices.push(x-c.originX*s*r+c.width*s*r, y+c.originY*s);
		    vertices.push((c.x+c.width)/font.width, c.y/font.height);
		    vertices.push(x-c.originX*s*r+c.width*s*r, y+c.originY*s-c.height*s);
		    vertices.push((c.x+c.width)/font.width, (c.y+c.height)/font.height);
    		vertices.push(x-c.originX*s*r+c.width*s*r, y+c.originY*s);
    		vertices.push((c.x+c.width)/font.width, c.y/font.height);
            vertices.push(x-c.originX*s*r, y+c.originY*s-c.height*s);
    		vertices.push(c.x/font.width, (c.y+c.height)/font.height);
		    x += c.advance*s*r;
		}
		// Envoi des données
		var vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.textProgramInfo.attribLocations.vertexPosition, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.vertexAttribDivisor(this.textProgramInfo.attribLocations.vertexPosition, 0);
		this.gl.enableVertexAttribArray(this.textProgramInfo.attribLocations.vertexPosition);
		this.gl.uniform4fv(this.textProgramInfo.uniformLocations.textColor, color);
		this.gl.uniform1f(this.textProgramInfo.uniformLocations.aspectRatio, 1);
		// Dessin
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length/4);
	}
	
	Renderer.prototype.drawInterfaceQuad = function(x, y, width, height, color) {
		// Initialisation du programme 
		if (!this.interfaceProgramInfo) {
			var vertexCode = `
			  attribute highp vec2 aVertexPosition;
			  attribute mediump vec4 aVertexColor;
			  uniform mediump vec2 uAspectRatio;
			  varying mediump vec4 vColor;
			  void main(void) {
				gl_Position = vec4(uAspectRatio * aVertexPosition, 0.0, 1.0);
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
			this.interfaceProgramInfo = {
				program: shaderProgram,
				attribLocations: {
					vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
					vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor')
				},
				uniformLocations: {
				    aspectRatio: this.gl.getUniformLocation(shaderProgram, 'uAspectRatio')
				}
			};
		}
		this.gl.useProgram(this.interfaceProgramInfo.program);
		// Calcul des valeurs
		var vertices = [
			x-width/2,y-height/2, x+width/2,y-height/2, x-width/2,y+height/2,
			x+width/2,y+height/2, x-width/2,y+height/2, x+width/2,y-height/2
		];
		var colors = [];
		for (let i = 0; i < 6; i++)
		    colors.push(color[0], color[1], color[2], color[3]||1);
		// Envoi des données
		this.gl.uniform2fv(this.interfaceProgramInfo.uniformLocations.aspectRatio, [1.0, 1.0]);
		//this.gl.uniform2fv(this.interfaceProgramInfo.uniformLocations.aspectRatio, [this.gl.canvas.height/this.gl.canvas.width, 1]);
		var vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.interfaceProgramInfo.attribLocations.vertexPosition, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.interfaceProgramInfo.attribLocations.vertexPosition);
		var colorsBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorsBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
		this.gl.vertexAttribPointer(this.interfaceProgramInfo.attribLocations.vertexColor, 4, this.gl.FLOAT, false, 0, 0);
		this.gl.vertexAttribDivisor(this.interfaceProgramInfo.attribLocations.vertexColor, 0);
		this.gl.enableVertexAttribArray(this.interfaceProgramInfo.attribLocations.vertexColor);
		// Dessin
		this.gl.depthFunc(this.gl.ALWAYS);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length/2);
	}
	
	Renderer.prototype.drawModel = function(model, x, y, size=1, rotation=[0,0,0], deltaTime=0) {
	    var allColors = [];
		var allNormals = [];
		var allTransforms = [];
		var allOrients = [];
		var allScales = [];
		
		// calcul de la transformation du modèle
		let transform = mat4.create();
		mat4.translate(transform, transform, [x,y,-1]);
		mat4.scale(transform, transform, [this.gl.canvas.clientHeight/this.gl.canvas.clientWidth,1,1]);
		mat4.rotateZ(transform, transform, rotation[2]);
		mat4.rotateY(transform, transform, rotation[1]);
		mat4.rotateX(transform, transform, rotation[0]);
		var scale = size * (model.scale||1);
		mat4.scale(transform, transform, [scale,scale,scale]);
		
		getModelBuffers({allColors, allNormals, allTransforms, allOrients, allScales}, model, transform, undefined);
		
		const projectionMatrix = [1,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,1];
        
		this.drawVoxels({
			colors: allColors,
			normals: allNormals,
			transforms: allTransforms,
			orients: allOrients,
			scales: allScales
		}, projectionMatrix, mat4.create(), 0);
	}
	
	return Renderer;
}();

// public
var Camera = function() {
	var Camera = function(position, targetPos=[0,0,0], rot=[0,0,0]) {
		this.target = targetPos.slice(0,3);
		this.rot = rot.slice(0,3);
		this.prevRot = rot.slice(0,3);
		this.position = position.slice(0,3); // par rapport à target
		this.prevPosition = position.slice(0,3);
	}
	
	Camera.prototype.getViewMatrix = function(tickProgress=1) {
		var vMatrix = mat4.create();
		var rot = this.getRot(tickProgress);
		mat4.translate(vMatrix, vMatrix, this.getPosition(tickProgress));
		mat4.rotate(vMatrix, vMatrix, rot[0], [1, 0, 0]);
		mat4.rotate(vMatrix, vMatrix, rot[1], [0, 1, 0]);
		mat4.rotate(vMatrix, vMatrix, rot[2], [0, 0, 1]);
		mat4.translate(vMatrix, vMatrix, [-this.target[0], -this.target[1], -this.target[2]]);
		return vMatrix;
	}
	
	Camera.prototype.setTargetPos = function(targetPos) {
		this.target = targetPos;
	}
	
	Camera.prototype.update = function() {
	    this.prevRot[0] = this.rot[0];
	    this.prevRot[1] = this.rot[1];
	    this.prevRot[2] = this.rot[2];
	    this.prevPosition[0] = this.position[0];
	    this.prevPosition[1] = this.position[1];
	    this.prevPosition[2] = this.position[2];
	};
	
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
	
	Camera.prototype.getPosition = function(tickProgress=1) {
		return [
		    tickProgress*this.position[0]+(1-tickProgress)*this.prevPosition[0],
		    tickProgress*this.position[1]+(1-tickProgress)*this.prevPosition[1],
		    tickProgress*this.position[2]+(1-tickProgress)*this.prevPosition[2]
	    ];
	}
	
	Camera.prototype.setDistance = function(distance, tp=false) {
		if (tp) {
			this.prevPosition[2] = distance;
		}
		this.position[2] = distance;
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
function loadJSONFile(url) {
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

// public static
function loadModelFromAssets(name) {
    return loadJSONFile("models/"+name+".json");
}

// public static
function loadFontFromAssets(name) {
    return loadJSONFile("fonts/"+name+".json");
}

// public extends ContainerComponent
var InterfaceDiv = function() {
    var InterfaceDiv = function(color=[.6,.6,.6,.8], transient=undefined) {
        this.color = color;
        this.components = [];
        this.visible = false;
        this.selectedComponent = transient||0;
        this.focus = false;
        this.transient = transient!==undefined;
    }
    
    InterfaceDiv.prototype.add = function(component) {
        this.components.push(component);
    };
    
    InterfaceDiv.prototype.setVisible = function(visible=true) {
        this.visible = visible;
        this.focus = visible;
        if (this.transient && this.focus)
            this.click();
    }
    
    InterfaceDiv.prototype.toggleVisible = function() {
        this.visible = !this.visible;
        this.focus = this.visible;
        if (this.transient && this.focus)
            this.click();
    }
    
    InterfaceDiv.prototype.isVisible = function() {
        return this.visible;
    }
    
    InterfaceDiv.prototype.next = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].next();
        if (++this.selectedComponent >= this.components.length)
            this.selectedComponent = 0;
    }
    
    InterfaceDiv.prototype.previous = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].previous();
        if (--this.selectedComponent < 0)
            this.selectedComponent = this.components.length-1;
    }
    
    InterfaceDiv.prototype.nextRow = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].nextRow();
    }
    
    InterfaceDiv.prototype.previousRow = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].previousRow();
    }
    
    InterfaceDiv.prototype.draw = function(renderer, x, y, width) {
        var height = this.getHeight();
		renderer.drawInterfaceQuad(x, y, width, height, this.color);
		y += height/2 - 0.05;
		width *= 0.9;
		let i = 0;
		for (let component of this.components) {
		    component.draw(renderer, x, y-component.getHeight()/2, width);
		    if (this.focus && this.selectedComponent==i) {
		        renderer.drawInterfaceQuad(x, y-.005, width, .01, [1,1,1,0.8]);
		        renderer.drawInterfaceQuad(x, y-component.getHeight()+.005, width, .01, [1,1,1,0.8]);
		        renderer.drawInterfaceQuad(x+width/2-.005, y-component.getHeight()/2, .01, component.getHeight(), [1,1,1,0.8]);
		        renderer.drawInterfaceQuad(x-width/2+.005, y-component.getHeight()/2, .01, component.getHeight(), [1,1,1,0.8]);
		    }
		    y += -component.getHeight() - 0.01;
		    i++;
		}
    }
    
    InterfaceDiv.prototype.getHeight = function() {
        var height = 0.05;
        for (let component of this.components)
            height += component.getHeight() + 0.01;
        return height+0.04;
    }
    
    InterfaceDiv.prototype.click = function(button=0) {
        if (this.selectedComponent<this.components.length) {
            if (this.focus && this.components[this.selectedComponent] instanceof InterfaceDiv || this.components[this.selectedComponent] instanceof InterfaceGrid) {
                this.focus = false;
                this.components[this.selectedComponent].focus = true;
            } else {
                this.components[this.selectedComponent].click(button);
            }
        }
    };
    
    InterfaceDiv.prototype.back = function() {
        if (this.focus) {
            this.focus = false;
            return true;
        } else {
            if (this.components[this.selectedComponent].back()) {
                if (this.transient) return true;
                this.focus = true;
            }
            return false;
        }
    };
    
    return InterfaceDiv;
}();

/*// public
var Component = function() {
    var Component = function() {
        
    }
    //click
    //draw
    //getHeight
    return Component;
}();*/

// public extends Component
var InterfaceText = function() {
    var InterfaceText = function(text, font, size=0.1, color=[1,1,1,1]) {
        this.text = text;
        this.font = font;
        this.size = size;
        this.color = color;
    };
    
    InterfaceText.prototype.click = function(x, y, click) {
        
    };
    
    InterfaceText.prototype.draw = function(renderer, x, y, width) {
        renderer.drawText(this.text, this.font, x, y+0.1*this.size, this.size*0.8, this.color, "center", "center");
    }
    
    InterfaceText.prototype.getHeight = function() {
        return this.size;
    }
    
    return InterfaceText;
}();

// public extends Component
var InterfaceButton = function() {
    var InterfaceButton = function(text, font, height=0.1, color=[1,0,0,1], textColor=[1,1,1,1]) {
        this.text = text;
        this.font = font;
        this.height = height;
        this.color = color;
        this.textColor = textColor;
        this.onclick = undefined;
    };
    
    InterfaceButton.prototype.setOnClick = function(onclick) {
        this.onclick = onclick;
    };
    
    InterfaceButton.prototype.click = function(x, y, click) {
        if (this.onclick)
            this.onclick();
    };
    
    InterfaceButton.prototype.draw = function(renderer, x, y, width) {
        renderer.drawInterfaceQuad(x, y, width, this.height, this.color);
        renderer.drawText(this.text, this.font, x, y+0.1*this.height, this.height*0.8, this.textColor, "center", "center");
    }
    
    InterfaceButton.prototype.getHeight = function() {
        return this.height;
    }
    
    return InterfaceButton;
}();

// public extends ContainerComponent
var InterfaceGrid = function() {
    var InterfaceGrid = function(componentsByLine, color=[.6,.6,.6,.8]) {
        this.componentsByLine = componentsByLine;
        this.color = color;
        this.components = [];
        this.visible = false;
        this.selectedComponent = 0;
        this.focus = false;
    }
    
    InterfaceGrid.prototype.add = function(component) {
        this.components.push(component);
    };
    
    InterfaceGrid.prototype.setVisible = function(visible=true) {
        this.visible = visible;
    }
    
    InterfaceGrid.prototype.toggleVisible = function() {
        this.visible = !this.visible;
    }
    
    InterfaceGrid.prototype.isVisible = function() {
        return this.visible;
    }
    
    InterfaceGrid.prototype.next = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].next();
        this.selectedComponent += this.componentsByLine;
        if (this.selectedComponent >= this.components.length)
            this.selectedComponent %= this.componentsByLine;
    }
    
    InterfaceGrid.prototype.previous = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].previous();
        this.selectedComponent -= this.componentsByLine;
        if (this.selectedComponent < 0) {
            this.selectedComponent = parseInt(this.components.length/this.componentsByLine+1)*(this.componentsByLine) + this.selectedComponent;
            if (this.selectedComponent>=this.components.length)
                this.selectedComponent -= this.componentsByLine;
        }
    }
    
    InterfaceGrid.prototype.nextRow = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].next();
        if (++this.selectedComponent >= this.components.length)
            this.selectedComponent = 0;
    }
    
    InterfaceGrid.prototype.previousRow = function() {
        if (!this.focus)
            return this.components[this.selectedComponent].previous();
        if (--this.selectedComponent < 0)
            this.selectedComponent = this.components.length-1;
    }
    
    InterfaceGrid.prototype.draw = function(renderer, X, Y, Width) {
        var Height = this.getHeight();
		renderer.drawInterfaceQuad(X, Y, Width, Height, this.color);
		Width *= 0.9;
		let y = Y + Height/2 - 0.05;
		let width = Width / this.componentsByLine - 0.01;
		let x = X - Width/2 + width/2;
		let height = 0;
		for (let i = 0; i < this.components.length; i++) {
		    let component = this.components[i];
		    component.draw(renderer, x, y-component.getHeight()/2, width);
		    if (this.focus && this.selectedComponent==i) {
		        renderer.drawInterfaceQuad(x, y-.005, width, .01, [1,1,1,0.8]);
		        renderer.drawInterfaceQuad(x, y-component.getHeight()+.005, width, .01, [1,1,1,0.8]);
		        renderer.drawInterfaceQuad(x+width/2-.005, y-component.getHeight()/2, .01, component.getHeight(), [1,1,1,0.8]);
		        renderer.drawInterfaceQuad(x-width/2+.005, y-component.getHeight()/2, .01, component.getHeight(), [1,1,1,0.8]);
		    }
		    height = Math.max(height, component.getHeight());
		    if (i%this.componentsByLine==this.componentsByLine-1) { // end of line
		        y += -height - 0.01;
		        x = X - Width/2 + width/2;
		        height = 0;
		    } else {
		        x += width + 0.01;
		    }
		}
    }
    
    InterfaceGrid.prototype.getHeight = function() {
        var height = 0.05;
        for (let i = 0; i < this.components.length/this.componentsByLine; i++) {
            let lineHeight = 0;
            for (let j = 0; j < this.components.length-i*this.componentsByLine; j++) {
                lineHeight = Math.max(lineHeight, this.components[i].getHeight());
            }
            height += lineHeight + 0.01;
        }
        return height+0.04;
    }
    
    InterfaceGrid.prototype.click = function(button=0) {
        if (this.selectedComponent<this.components.length) {
            if (this.focus && (this.components[this.selectedComponent] instanceof InterfaceDiv || this.components[this.selectedComponent] instanceof InterfaceGrid)) {
                this.focus = false;
                this.components[this.selectedComponent].focus = true;
            } else {
                this.components[this.selectedComponent].click(button);
            }
        }
    };
    
    InterfaceGrid.prototype.back = function() {
        if (this.focus) {
            this.focus = false;
            return true;
        } else {
            if (this.components[this.selectedComponent].back())
                this.focus = true;
            return false;
        }
    };
    
    return InterfaceGrid;
}();

// public extends Component
var InterfaceModelView = function() {
    var InterfaceModelView = function(model, font, size=0.1, color=[1,1,1,0.1], textColor=[1,1,1,1]) {
        this.model = model;
        this.font = font;
        this.size = size;
        this.color = color;
        this.textColor = textColor;
        this.onclick = undefined;
    };
    
    InterfaceModelView.prototype.setOnClick = function(onclick) {
        this.onclick = onclick;
    };
    
    InterfaceModelView.prototype.click = function(x, y, click) {
        if (this.onclick)
            this.onclick();
    };
    
    InterfaceModelView.prototype.draw = function(renderer, x, y, width) {
        renderer.drawInterfaceQuad(x, y, this.model?width:width/2, this.model?this.size:this.size/2, this.color);
        if (this.model)
            renderer.drawModel(this.model, x, y, width*0.5, [Math.PI/4, Math.PI/5, Math.PI/6], 0);
        //renderer.drawText(this.text, this.font, x, y+0.1*this.height, this.height*0.8, this.textColor, "center", "center");
    }
    
    InterfaceModelView.prototype.getHeight = function() {
        return this.size;
    }
    
    return InterfaceModelView;
}();