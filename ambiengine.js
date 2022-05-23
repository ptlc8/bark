/**
 * @version: v0.2
 * @author: Ambi
 */
AmbiEngine = function() {
    var log = function(message) {
        console.log("[AmbiEngine] "+message);
    }
    var error = function(message) {
        console.error("[AmbiEngine] "+message);
    }
    // init unused...
    var create = function(cvs, w, h, init, update, render, tps=30, listeners={}) {
        cvs.width = w;
        cvs.height = h;
        var ctx = cvs.getContext("2d");
        cvs.addEventListener("contextmenu", function(e) {
			e.preventDefault();
		});
        // camera
        var cam = {x:0, y:0, s:100};
        var getCameraPos = function() {
            return {x:cam.x,y:cam.y};
        }
        var setCameraPos = function(x, y) {
            cam.x = x;
            cam.y = y;
        }
        var getCameraSize = function() {
            return cam.s;
        }
        var setCameraSize = function(s) {
            cam.s = s;
        }
        /*var getCameraWidth = function() {
            return Math.max(cam.s*cvs.width/cvs.height, cam.s);
        }
        var getCameraHeight = function() {
            return Math.max(cam.s*cvs.height/cvs.width, cam.s);
        }*/
        var convertSize = function(xOrY, z=1) {
            return xOrY*Math.min(cvs.width, cvs.height)/cam.s*z;
        }
        var convertX = function(x, z=1) {
            return (x-cam.x)*z*Math.min(cvs.width, cvs.height)/cam.s+cvs.width/2;
        }
        var convertY = function(y, z=1) {
            return (y*z-cam.y)*z*Math.min(cvs.width, cvs.height)/cam.s+cvs.height/2;
        }
        // events
        for (let event of Object.keys(listeners)) {
            if (!["mousedown","mouseup","keyup","keydown","mousemove","touchstart","touchend","touchcancel","touchleave","touchmove"].includes(event)) {
                error("Unknown event : "+event);
                continue;
            }
            let eventType = event;
            if (event.startsWith("mouse")) // mouse events
                cvs.addEventListener(event, function(e) {
                    let sx = e.offsetX*cvs.width/cvs.clientWidth, sy = e.offsetY*cvs.height/cvs.clientHeight;
                    listeners[event]({wx:(sx-cvs.width/2)*cam.s/Math.min(cvs.width, cvs.height)+cam.x, wy:(sy-cvs.height/2)*cam.s/Math.min(cvs.width, cvs.height)+cam.y,
						rx: (sx-cvs.width/2)*200/Math.min(cvs.width, cvs.height), ry: (sy-cvs.height/2)*200/Math.min(cvs.width, cvs.height),
						sx:sx, sy:sy, button:e.button, buttons:e.buttons, type:eventType});
					e.preventDefault();
					cvs.focus();
                });
            else if (event.startsWith("touch")) // touch events
                cvs.addEventListener(event, function(e) {
                    let sx = (e.changedTouches[0].clientX-cvs.getBoundingClientRect().left)*cvs.width/cvs.clientWidth
                    let sy = (e.changedTouches[0].clientY-cvs.getBoundingClientRect().top)*cvs.height/cvs.clientHeight;
                    listeners[event]({wx:(sx-cvs.width/2)*cam.s/Math.min(cvs.width, cvs.height)+cam.x, wy:(sy-cvs.height/2)*cam.s/Math.min(cvs.width, cvs.height)+cam.y,
						rx: (sx-cvs.width/2)*200/Math.min(cvs.width, cvs.height), ry: (sy-cvs.height/2)*200/Math.min(cvs.width, cvs.height),
						sx:sx, sy:sy, button:e.changedTouches[0].identifier, type:eventType});
					e.preventDefault();
					cvs.focus();
                });
            else { // keyboard events
                cvs.tabIndex = 0;
                cvs.addEventListener(event, function(e) {
                    listeners[event]({code:e.code, keyCode:e.keyCode, type:eventType});
                });
            }
        }
        // worldContext
        var drawingWorldZ = 0;
        var worldConvertX = function(x) {
            return convertX(x, Math.exp(drawingWorldZ));
        }
        var worldConvertY = function(y) {
            return convertY(y, Math.exp(drawingWorldZ));
        }
        var worldConvertSize = function(s) {
            return convertSize(s, Math.exp(drawingWorldZ));
        }
        var worldDrawRect = function(color, x, y, w, h, angle=0, originX=0, originY=0) {
            ctx.fillStyle = color;
            x = worldConvertX(x);
            y = worldConvertY(y);
            w = worldConvertSize(w);
            h = worldConvertSize(h);
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.translate(-originX*w, -originY*h);
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.translate(originX*w, originY*h);
            ctx.rotate(-angle);
            ctx.translate(-x, -y);
        }
        var worldDrawRectInfiniteX = function(color, y, h) {
            ctx.fillStyle = color;
            ctx.fillRect(0, worldConvertY(y), cvs.width, worldConvertSize(h));
        }
        var worldDrawRectInfiniteY = function(color, x, w) {
            ctx.fillStyle = color;
            ctx.fillRect(worldConvertX(x), 0, worldConvertSize(w), cvs.height);
        }
        var worldDrawLines = function(color, xs, ys, thickness=1, close=false) {
			if (!xs.length || !ys.length || xs.length!=ys.length) {
				error("Invalid coordinates");
				return;
			}
			ctx.strokeStyle = color;
			ctx.lineWidth = worldConvertSize(thickness);
			ctx.beginPath();
			ctx.moveTo(worldConvertX(xs[0]), worldConvertY(ys[0]));
			for (let i = 1; i < xs.length; i++) {
				ctx.lineTo(worldConvertX(xs[i]), worldConvertY(ys[i]));
			}
			if (close) ctx.lineTo(worldConvertX(xs[0]), worldConvertY(ys[0]));
			ctx.stroke();
		}
		var worldDrawCircle = function(color, x, y, r) {
			ctx.fillStyle = color;
            x = worldConvertX(x);
            y = worldConvertY(y);
            r = worldConvertSize(r);
            ctx.translate(x, y);
            ctx.ellipse(0, 0, r, r, 0, 0, Math.PI*2);
            ctx.translate(-x, -y);
		}
		var worldDrawImage = function(image, x, y, w, h, angle=0, originX=0, originY=0) {
            x = worldConvertX(x);
            y = worldConvertY(y);
            w = worldConvertSize(w);
            h = worldConvertSize(h);
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.translate(-originX*w, -originY*h);
            try {
                ctx.drawImage(image, -w/2, -h/2, w, h);
            } catch(e) {}
            ctx.translate(originX*w, originY*h);
            ctx.rotate(-angle);
            ctx.translate(-x, -y);
		}
		var worldDrawImageInfiniteX = function(image, x, y, w, h) {
			x = worldConvertX(x);
            y = worldConvertY(y);
            w = worldConvertSize(w);
            h = worldConvertSize(h);
			ctx.translate(0, y);
			for (let j = (x%w-w)%w; j<cvs.width+w/2; j+=w) {
				try {
					ctx.drawImage(image, j-w/2, -h/2, w, h);
				} catch(e) {}
            }
            ctx.translate(0, -y);
        }
		var worldDrawText = function(text, x, y, fontHeight, color, angle=0, strokeColor=undefined, textAlign="left", originY=0, font="Arial", maxWidth=undefined) {
			fontHeight = worldConvertSize(fontHeight);
			x = worldConvertX(x);
            y = worldConvertY(y);
            if (maxWidth) maxWidth = worldConvertSize(maxWidth);
			ctx.fillStyle = color;
			if (strokeColor) ctx.strokeStyle = strokeColor;
			if (strokeColor) ctx.lineWidth = 0.03*fontHeight;
			ctx.font = fontHeight+"px "+font;
			ctx.textAlign = textAlign;
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.translate(0, -originY*h);
            ctx.fillText(text, 0, fontHeight/2, maxWidth);
            if (strokeColor) ctx.strokeText(text, 0, fontHeight/2, maxWidth);
            ctx.translate(0, originY*h);
            ctx.rotate(-angle);
            ctx.translate(-x, -y);
		}
		var clear = function() {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
        }
        var worldGetZ = function() {
            return drawingWorldZ;
        }
        var worldSetZ = function(z) {
            drawingWorldZ = z;
        }
        var worldContext = {
            drawRect: worldDrawRect,
            drawRectInfiniteX: worldDrawRectInfiniteX,
            drawRectInfiniteY: worldDrawRectInfiniteY,
            drawLines: worldDrawLines,
            drawCircle: worldDrawCircle,
            drawImage: worldDrawImage,
            drawImageInfiniteX: worldDrawImageInfiniteX,
            drawText: worldDrawText,
            clear: clear,
            getZ: worldGetZ,
            setZ: worldSetZ
        };
        // rendererContext
        var rendererConvertX = function(x) {
			return x*Math.min(cvs.width, cvs.height)/200+cvs.width/2;
		}
		var rendererConvertY = function(y) {
			return y*Math.min(cvs.width, cvs.height)/200+cvs.height/2;
		}
		var rendererConvertSize = function(s) {
			return s*Math.min(cvs.width, cvs.height)/200;
		}
        var rendererDrawRect = function(color, x, y, w, h, angle=0, originX=0, originY=0) {
            ctx.fillStyle = color;
            x = rendererConvertX(x);
            y = rendererConvertY(y);
            w = rendererConvertSize(w);
            h = rendererConvertSize(h);
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.translate(-originX*w, -originY*h);
            ctx.fillRect(-w/2, -h/2, w, h);
            ctx.translate(originX*w, originY*h);
            ctx.rotate(-angle);
            ctx.translate(-x, -y);
        }
        var rendererDrawRectInfiniteX = function(color, y, h) {
            ctx.fillStyle = color;
            ctx.fillRect(0, rendererConvertY(y), cvs.width, rendererConvertSize(h));
        }
        var rendererDrawRectInfiniteY = function(color, x, w) {
            ctx.fillStyle = color;
            ctx.fillRect(rendererConvertX(x), 0, rendererConvertSize(w), cvs.height);
        }
        var rendererDrawLines = function(color, xs, ys, thickness=1, close=false) {
			if (!xs.length || !ys.length || xs.length!=ys.length) {
				error("Invalid coordinates");
				return;
			}
			ctx.strokeStyle = color;
			ctx.lineWidth = rendererConvertSize(thickness);
			ctx.beginPath();
			ctx.moveTo(rendererConvertX(xs[0]), rendererConvertY(ys[0]));
			for (let i = 1; i < xs.length; i++) {
				ctx.lineTo(rendererConvertX(xs[i]), rendererConvertY(ys[i]));
			}
			if (close) ctx.lineTo(rendererConvertX(xs[0]), rendererConvertY(ys[0]));
			ctx.stroke();
		}
		var rendererDrawCircle = function(color, x, y, r) {
			ctx.fillStyle = color;
            x = rendererConvertX(x);
            y = rendererConvertY(y);
            r = rendererConvertSize(r);
            ctx.translate(x, y);
            ctx.ellipse(0, 0, r, r, 0, 0, Math.PI*2);
            ctx.translate(-x, -y);
		}
		var rendererDrawImage = function(image, x, y, w, h, angle=0, originX=0, originY=0) {
            x = rendererConvertX(x);
            y = rendererConvertY(y);
            w = rendererConvertSize(w);
            h = rendererConvertSize(h);
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.translate(-originX*w, -originY*h);
            try {
                ctx.drawImage(image, -w/2, -h/2, w, h);
            } catch (e) {}
            ctx.translate(originX*w, originY*h);
            ctx.rotate(-angle);
            ctx.translate(-x, -y);
		}
		var rendererDrawText = function(text, x, y, fontHeight, color, angle=0, strokeColor=undefined, textAlign="left", originY=0, font="Arial", maxWidth=undefined) {
			fontHeight = rendererConvertSize(fontHeight);
			x = rendererConvertX(x);
            y = rendererConvertY(y);
            if (maxWidth) maxWidth = rendererConvertSize(maxWidth);
			ctx.fillStyle = color;
			if (strokeColor) ctx.strokeStyle = strokeColor;
			if (strokeColor) ctx.lineWidth = 0.03*fontHeight;
			ctx.font = fontHeight+"px "+font;
			ctx.textAlign = textAlign;
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.translate(0, -originY*fontHeight);
            ctx.fillText(text, 0, fontHeight/2, maxWidth);
            if (strokeColor) ctx.strokeText(text, 0, fontHeight/2, maxWidth);
            ctx.translate(0, originY*fontHeight);
            ctx.rotate(-angle);
            ctx.translate(-x, -y);
		}
        var rendererContext = {
            drawRect: rendererDrawRect,
            drawRectInfiniteX: rendererDrawRectInfiniteX,
            drawRectInfiniteY: rendererDrawRectInfiniteY,
            drawLines: rendererDrawLines,
            drawCircle: rendererDrawCircle,
            drawText: rendererDrawText,
            drawImage: rendererDrawImage
        };
        // loops
        var running = false;
        var updateIntervalId;
        var run = function() {
			running = true;
			var lastTick = Date.now();
			updateIntervalId = setInterval(function() {
				for (; lastTick+tps < Date.now(); lastTick+=tps)
					update(tps);
				//update(-lastTick + (lastTick = Date.now()));
			}, 1000/tps);
			var requestRender = function() {
				requestAnimationFrame(function() {
					if (ctx.resetTransform) ctx.resetTransform();
					render(worldContext, rendererContext, cvs.width/cvs.height);
					if (running) requestRender(requestRender);
				});
			}
			requestRender();
		}
		var pause = function() {
			running = false;
			clearInterval(updateIntervalId);
		}
		// return
        return {
			run: run,
			pause: pause,
			getCameraPos: getCameraPos,
            setCameraPos: setCameraPos,
            getCameraSize: getCameraSize,
            setCameraSize: setCameraSize,
            setCursor: function(cursor) {cvs.style.cursor=cursor;}
        };
    }
    // Gestion des images
    var newImage = function(src) {
		var img = new Image();
		img.src = src;
		return img;
	}
    var images = {no: newImage("assets/no.png"), loading: newImage("assets/loading.png")};
	var getImage = function(src, ignoreLoading=false) {
		src = src;
		if (images[src]) return images[src].complete || ignoreLoading ? images[src] : images.loading;
		//info("Loading Image : " + src);
		var img = new Image();
		img.onerror = function() {
			images[src] = images.no;
			error("Can't load image : " + src);
		}
		img.onload = function() {
			log("Image loaded : " + src);
		}
		img.src = src;
		images[src] = img;
		return ignoreLoading ? img : images.loading;
	}
    return {
        create: create,
        getImage: getImage
    };
}();
