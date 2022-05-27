"use strict";
var Inventory = (function() {
    class Inventory {
        constructor(size = 16, stackSize = 16) {
            this.items = [];
            this.size = size;
            this.stackSize = stackSize;
        }
        add(id, amount = 1) {
            for (let i = 0; i < this.size; i++) {
                if (amount == 0)
                    return 0;
                if (!this.items[i]) {
                    this.items[i] = { id: id, amount: Math.min(amount, this.stackSize) };
                    amount -= Math.min(amount, this.stackSize);
                } else if (this.items[i].id == id) {
                    let a = amount;
                    amount -= Math.min(amount, this.stackSize - this.items[i].amount);
                    this.items[i].amount += Math.min(a, this.stackSize - this.items[i].amount);
                }
            }
            return amount;
        }
        count(id) {
            var count = 0;
            for (let item of this.items) {
                if (item && item.id==id)
                    count += item.amount;
            }
            return count;
        }
        has(id, amount = 1) {
            return this.count(id) >= amount;
        }
        remove(id, amount = 1) {
            for (let i = this.size - 1; i >= 0; i--) {
                if (amount == 0)
                    return 0;
                if (this.items[i] && this.items[i].id == id) {
                    if (this.items[i].amount <= amount) {
                        amount -= this.items[i].amount;
                        this.items[i] = undefined;
                    } else {
                        this.items[i].amount -= amount;
                        amount = 0;
                    }
                }
            }
            return amount;
        }
        *[Symbol.iterator]() {
            for (let i = 0; i < this.size; i++)
                yield this.items[i];
        }
        craft(craft) {
            for (let [itemId,amount] of Object.entries(craft.ingredients)) {
                if (!this.has(itemId, amount)) {
                    return false;     
			    }
		    }
            for (let [itemId,amount] of Object.entries(craft.ingredients)) {
                this.remove(itemId, amount);
		    }
            this.add(craft.resultItemId, craft.resultAmount);
            return true;
	    }
    }
    
    return Inventory;
})();