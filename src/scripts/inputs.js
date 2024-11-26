"use strict";
var InputsManager = (function() {
    // mapping : paires de touches (MouseButton1, KeyE, Space, GamepadButton5 etc. ; GamepadAxe1, MouseMoveX etc.) et d'entrée (jump, grab etc. ; ou +moveX, -moveX etc. pour les axes en 2 boutons)
    class InputsManager {
        constructor(mapping, htmlElement = document) {
            this.mapping = mapping;
            this.values = {};
            this.lastInputs = {};
            this.hasGamepad = navigator.getGamepads()[0] != null;
            this.scanResolve = null;
            this.scanTime = 0;
            // listen keyboard
            htmlElement.addEventListener("keydown", e => this.values[e.code] = 1);
            htmlElement.addEventListener("keyup", e => this.values[e.code] = 0);
            // listen mouse
            htmlElement.addEventListener("mousedown", e => this.values["MouseButton" + e.button] = 1);
            htmlElement.addEventListener("mouseup", e => this.values["MouseButton" + e.button] = 0);
            htmlElement.addEventListener("mousemove", (e) => {
                if (Math.abs(e.movementX) > Math.abs(e.movementY))
                    this.values["Mouse" + (this.isGrabbing() > 0 ? "Grab" : "") + "MoveX"] += e.movementX / 50;
                this.values["Mouse" + (this.isGrabbing() > 0 ? "Grab" : "") + "MoveY"] += e.movementY / 50;
                if (Math.abs(e.movementX) <= Math.abs(e.movementY))
                    this.values["Mouse" + (this.isGrabbing() > 0 ? "Grab" : "") + "MoveX"] += e.movementX / 50, true;
            });
            // listen gamepads
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
            // gamepad 1
            var gamepad = (navigator.getGamepads ? navigator.getGamepads() : [])[0];
            if (gamepad) {
                for (const [i, button] of Object.entries(gamepad.buttons))
                    this.values["GamepadButton" + i] = button.pressed ? 1 : 0;
                for (const [i, axe] of Object.entries(gamepad.axes))
                    if (axe > 0.2 || axe < -0.2)
                        this.values["GamepadAxe" + i] = Math.round(axe*10) / 10;
                    else
                        this.values["GamepadAxe" + i] = 0;
            }
            for (const [key, value] of Object.entries(this.values)) {
                if (value != 0 && this.scanResolve && Date.now() - this.scanTime > 100) {
                    this.scanResolve(key);
                    this.scanResolve = null;
                }
            }
            // initialize
            var inputs = {};
            for (const [key, input] of this.mapping) {
                inputs[input] = { value: 0 };
                if (input.startsWith("+") || input.startsWith("-"))
                    inputs[input.substring(1)] = { value: 0 };
            }
            // map keys to inputs
            for (let [key, input] of this.mapping) {
                if (key.startsWith("+"))
                    inputs[input].value += Math.max(this.values[key.replace("+", "")] ?? 0, 0);
                else if (key.startsWith("-"))
                    inputs[input].value -= Math.min(this.values[key.replace("-", "")] ?? 0, 0);
                else
                    inputs[input].value += this.values[key] ?? 0;
            }
            // simulate axes
            for (const [name, input] of Object.entries(inputs)) {
                if (input.value == 0) continue;
                if (name.startsWith("+")) {
                    inputs[name.slice(1)].value += input.value;
                } else if (name.startsWith("-")) {
                    inputs[name.slice(1)].value -= input.value;
                }
            }
            // simulate clicks
            for (const [name, input] of Object.entries(inputs)) {
                input.clicked = input.value != 0 && sign(input.value) != sign(this.lastInputs[name]?.value);
            }
            // return and reset mouse moves
            this.lastInputs = inputs;

            this.values["MouseMoveX"] = 0;
            this.values["MouseMoveY"] = 0;
            this.values["MouseGrabMoveX"] = 0;
            this.values["MouseGrabMoveY"] = 0;
            return inputs;
        }
        scan() {
            this.scanTime = Date.now();
            return new Promise((resolve, reject) => {
                this.scanResolve = resolve;
            });
        }
        isGrabbing() {
            return this.values["MouseButton0"] > 0;
        }
        setKey(index, key, input) {
            this.mapping[index] = [key, input];
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
        let sign = "";
        if (key.startsWith("+") || key.startsWith("-"))
            sign = key[0], key = key.slice(1);
        if (key.startsWith("MouseButton"))
            return "Bouton souris " + key.slice(10);
        if (key.startsWith("GamepadButton"))
            return "Bouton manette " + key.slice(13);
        if (key.startsWith("GamepadAxe"))
            return "Axe manette " + key.slice(10) + " " + sign;
        if (key.startsWith("MouseGrabMove"))
            return "Déplacement souris maintenue " + key.slice(13) + " " + sign;
        if (key.startsWith("MouseMove"))
            return "Déplacement souris " + key.slice(9) + " " + sign;
        if (key.startsWith("Key"))
            return key.slice(3);
        if (key.startsWith("Numpad"))
            return "Pavé numérique " + key.slice(6);
        return key;
    };
    InputsManager.getKeyName = getKeyName;

    return InputsManager;
})();

// private
var sign = function(x) {
    return x>0?1:x<0?-1:0;
};