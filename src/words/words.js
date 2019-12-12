"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getWords() {
    return require("fs").readFileSync("./src/words/rus.txt", "utf8");
}
exports.getWords = getWords;
