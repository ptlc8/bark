"use strict";
// public static
function loadJSONFile(url) {
    return new (Promise)(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                resolve(JSON.parse(this.response));
            }
        };
        xhr.send();
    });
}

// public static
function loadModelFromAssets(name) {
    return loadJSONFile("models/"+name+".json");
}

// public static
function loadFontFromAssets(name) {
    return loadJSONFile("fonts/"+name+".json");
}