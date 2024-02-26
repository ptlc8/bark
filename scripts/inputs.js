"use strict";
var InputsManager = (function() {
    // keys : paires de touches (MouseButton1, KeyE, Space, GamepadButton5 etc. ; GamepadAxe1, MouseMoveX etc.) et d'entrée (jump, grab etc. ; ou +moveX, -moveX etc. pour les axes en 2 boutons)
    class InputsManager {
        constructor(keys, htmlElement = document) {
            this.keys = keys;
            this.inputs = {};
            this.hasGamepad = navigator.getGamepads()[0]!=null;
            this.grabbing = false;
            this.scanResolve = null;
            for (let key of keys) {
                this.inputs[key[1]] = { pressed: false, clicked: false, value: 0 };
                /*if (key[1].startsWith("+") || key[1].startsWith("-"))
                    this.inputs[key[1].substring(1)] = {value:0};*/
            }
            // clavier
            htmlElement.addEventListener("keydown", (e) => {
                this.onKey(e.code);
                for (const key of this.keys) {
                    if (key[0] == e.code) {
                        if (!this.inputs[key[1]].pressed)
                            this.inputs[key[1]].clicked = true;
                        this.inputs[key[1]].pressed = true;
                    }
                }
            });
            htmlElement.addEventListener("keyup", (e) => {
                for (const key of this.keys) {
                    if (key[0] == e.code)
                        this.inputs[key[1]].pressed = false;
                }
            });
            // souris
            htmlElement.addEventListener("mousedown", (e) => {
                this.onKey("MouseButton" + e.button);
                if (e.button == 0)
                    this.grabbing = true;
                for (const key of this.keys) {
                    if (key[0] == "MouseButton" + e.button) {
                        if (!this.inputs[key[1]].pressed)
                            this.inputs[key[1]].clicked = true;
                        this.inputs[key[1]].pressed = true;
                    }
                }
            });
            htmlElement.addEventListener("mouseup", (e) => {
                if (e.button == 0)
                    this.grabbing = false;
                for (const key of this.keys) {
                    if (key[0] == "MouseButton" + e.button)
                        this.inputs[key[1]].pressed = false;
                }
            });
            htmlElement.addEventListener("mousemove", (e) => {
                if (e.movementX != 0)
                    this.onKey("Mouse" + (this.grabbing ? "Grab" : "") + "MoveX", true);
                if (e.movementY != 0)
                    this.onKey("Mouse" + (this.grabbing ? "Grab" : "") + "MoveY", true);
                for (let key of this.keys) {
                    if (key[0] == "MouseMoveX")
                        this.inputs[key[1]].value += e.movementX / 50;
                    if (key[0] == "MouseMoveY")
                        this.inputs[key[1]].value += e.movementY / 50;
                    if (this.grabbing && key[0] == "MouseGrabMoveX")
                        this.inputs[key[1]].value += e.movementX / 50;
                    if (this.grabbing && key[0] == "MouseGrabMoveY")
                        this.inputs[key[1]].value += e.movementY / 50;
                }
            });
            // manette
            window.addEventListener("gamepadconnected", (e) => {
                if (e.gamepad.index == 0)
                    this.hasGamepad = true;
            });
            window.addEventListener("gamepaddisconnected", (e) => {
                if (e.gamepad.index == 0)
                    this.hasGamepad = false;
            });
        }
        getInputs() {
            // gamepad 1 boutons
            var gamepad = (navigator.getGamepads ? navigator.getGamepads() : [])[0];
            if (gamepad) {
                for (const [i, button] of Object.entries(gamepad.buttons)) {
                    if (button.pressed) this.onKey("GamepadButton" + i);
                    for (const key of this.keys)
                        if (key[0] == "GamepadButton" + i) {
                            if (!this.inputs[key[1]].pressed && button.pressed)
                                this.inputs[key[1]].clicked = true;
                            this.inputs[key[1]].pressed = button.pressed;
                        }
                }
                for (const [i, axe] of Object.entries(gamepad.axes)) {
                    if (Math.round(axe*50) != 0) this.onKey("GamepadAxe" + i, true);
                    for (let key of this.keys) {
                        if (key[0] == "GamepadAxe" + i) {
                            this.inputs[key[1]].value += Math.round(axe * 50) / 50;
                        }
                    }
                }
            }
            // axes
            for (const [name, input] of Object.entries(this.inputs)) {
                if (!input.pressed)
                    continue;
                if (name.startsWith("+")) {
                    this.inputs[name.slice(1)].value += 1;
                } else if (name.startsWith("-")) {
                    this.inputs[name.slice(1)].value -= 1;
                }
            }
            // click axes
            for (const [name, input] of Object.entries(this.inputs)) {
                if (input.value != 0 && sign(input.value) != sign(input.exvalue)) {
                    input.clicked = true;
                }
            }
            var inputsToSend = JSON.parse(JSON.stringify(this.inputs));
            // unclicks et unaxes
            for (const [name, input] of Object.entries(this.inputs)) {
                input.clicked = false;
                input.exvalue = input.value;
                input.value = 0;
            }
            // return
            return inputsToSend;
        }
        getInputName(input) {
            
        }
        onKey(key, axis=false) {
            if (this.scanResolve) {
                this.scanResolve(key);
                this.scanResolve = null;
            }
        }
        scan() {
            return new Promise((resolve, reject) => {
                this.scanResolve = resolve;
            });
        }
    }

    // static
    var vibrate = function(duration=200, strongMagnitude=1.0, weakMagnitude=1.0) {
        var gamepad = (navigator.getGamepads?navigator.getGamepads():[])[0];
        if (gamepad) {
            if (gamepad.vibrationActuator)
                gamepad.vibrationActuator.playEffect("dual-rumble", {duration,strongMagnitude,weakMagnitude});
            if (gamepad.hapticActuators && gamepad.hapticActuators[0])
                gamepad.hapticActuators[0].pulse(strongMagnitude, duration);
        }
    };
    InputsManager.vibrate = vibrate;
    // static
    var getKeyName = function(key) {
        return key;
    };
    InputsManager.getKeyName = getKeyName;

    return InputsManager;
})();

// private
var sign = function(x) {
    return x>0?1:x<0?-1:0;
};