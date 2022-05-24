"use strict";
var Item = (function() {
    class Item {
        constructor(id, driftingProba = 0) {
            this.id = id;
            this.driftingProba = driftingProba;
        }
    }
    
    return Item;
})();