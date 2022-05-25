"use strict";
var Craft = (function() {
    class Craft {
        constructor(id, ...items) {
            this.id = id;
            this.items = items;
        }
    }
    
    return Craft;
})();