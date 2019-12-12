"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mapRooms(rooms) {
    return rooms.map(mapRoom);
}
exports.mapRooms = mapRooms;
function mapRoom(room) {
    return Object.assign(Object.assign({}, room), { users: room.users.length, password: "" });
}
exports.mapRoom = mapRoom;
function mapUsers(users) {
    return users.map(mapUser);
}
exports.mapUsers = mapUsers;
function mapUser(user) {
    return {
        id: user.socket.id,
        name: user.name,
        active: user.active,
        score: user.score,
        color: user.color
    };
}
exports.mapUser = mapUser;
function mapMessage(params) {
    return { author: params.from, message: params.message };
}
exports.mapMessage = mapMessage;
function mapPrivateMessage(params) {
    return {
        author: params.from,
        message: params.message,
        to: params.to
    };
}
exports.mapPrivateMessage = mapPrivateMessage;
