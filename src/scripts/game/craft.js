"use strict";
var Craft = (function() {
    class Craft {
        constructor(resultItemId, resultAmount, ingredients={}) {
            this.resultItemId = resultItemId;
            this.resultAmount = resultAmount;
            this.ingredients = ingredients;
        }
    }
    
    return Craft;
})();