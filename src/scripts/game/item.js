"use strict";
var Item = (function() {
    class Item {
        constructor(id, name, properties={}) {
            this.id = id;
            this.name = name;
            this.driftingProba = properties.driftingProba || 0;
            this.placeable = properties.placeable || false;
        }
    }

    return Item;
})();