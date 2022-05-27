"use strict";
var Item = (function() {
    class Item {
        constructor(id, name, driftingProba = 0) {
            this.id = id;
            this.name = name;
            this.driftingProba = driftingProba;
        }
    }
    
    return Item;
})();