"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function send(socket, event, value) {
    console.log(`${socket.id} :: ${event} :: ${value}`);
    socket.emit(event, value);
}
exports.send = send;
function sendToAll(socket, event, value) {
    console.log(`To all :: ${event} :: ${value}`);
    socket.broadcast.emit(event, value);
}
exports.sendToAll = sendToAll;
function sendToMembersOfRoom(room, event, value, mapFn) {
    room.users.forEach(user => send(user.socket, event, mapFn ? mapFn(value) : value));
}
exports.sendToMembersOfRoom = sendToMembersOfRoom;
function sendError(socket, value) {
    socket.emit("err", value);
}
exports.sendError = sendError;
function sendWordError(socket, value) {
    socket.emit("word-err", value);
}
exports.sendWordError = sendWordError;
