"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mappers_1 = require("./src/mappers");
const words_1 = require("./src/words/words");
const io_events_1 = require("./src/io-events");
const colors_1 = require("./src/colors");
let express = require("express");
let app = express();
let server = require("http").createServer(app);
let io = require("socket.io")(server);
let rooms = [];
const words = words_1.getWords();
function nextUser(room, id, skip) {
    const index = room.users.findIndex(user => user.socket.id === id);
    if (room.users[index].active) {
        room.users[index].active = false;
        if (!skip) {
            room.users[index].score++;
        }
        if (index < room.users.length - 1) {
            room.users[index + 1].active = true;
        }
        else {
            room.users[0].active = true;
        }
    }
}
function checkLastSymbol(prevWord, newWord) {
    let lastSymbol = prevWord[prevWord.length - 1];
    const firstSymbol = newWord[0];
    if (lastSymbol === "ь" || lastSymbol === "ы") {
        lastSymbol = prevWord[prevWord.length - 2];
    }
    if (lastSymbol === "й" && firstSymbol !== "й") {
        lastSymbol = prevWord[prevWord.length - 2];
    }
    return lastSymbol !== firstSymbol;
}
if (process.env.NODE_END === "production") {
    app.use(express.static("client/build"));
    app.get("/*", (req, res) => {
        res.sendFile(`${__dirname}/client/build/index.html`);
    });
}
server.listen(8080, () => console.log("Server started on *:8080"));
io.sockets.on("connection", (socket) => {
    io_events_1.send(socket, "connected");
    socket.on("get-rooms", () => io_events_1.send(socket, "return-rooms", mappers_1.mapRooms(rooms)));
    socket.on("create-room", (params) => {
        if (rooms.find(room => room.name === params.roomName)) {
            io_events_1.sendError(socket, `Комната с названием '${params.roomName}' уже существует`);
            return;
        }
        let user = {
            socket,
            name: params.userName,
            active: true,
            score: 0,
            color: colors_1.colors[Math.floor(Math.random() * Math.floor(colors_1.colors.length))]
        };
        let room = {
            name: params.roomName,
            users: [user],
            words: [],
            private: params.password ? true : false,
            password: params.password
        };
        rooms.push(room);
        io_events_1.send(socket, "come-room", { room: mappers_1.mapRoom(room), user: mappers_1.mapUser(user) });
        io_events_1.send(socket, "new-room", mappers_1.mapRoom(room));
        io_events_1.sendToAll(socket, "new-room", mappers_1.mapRoom(room));
    });
    socket.on("connect-room", (params) => {
        let room = rooms.find(room => room.name === params.roomName);
        if (!room) {
            console.error(socket.id + " :: room not found :: " + params.roomName);
            return;
        }
        if (room.users.some(user => user.name === params.userName)) {
            io_events_1.sendError(socket, `В комнате уже есть '${params.userName}'`);
            return;
        }
        if (room.private && room.password !== params.password) {
            io_events_1.sendError(socket, "Неверный пароль");
            return;
        }
        let newUser = {
            socket,
            name: params.userName,
            active: !room.users.some(user => user.active === true),
            score: 0,
            color: colors_1.colors[Math.floor(Math.random() * Math.floor(colors_1.colors.length))]
        };
        room.users.push(newUser);
        rooms = rooms.map(r => (r.name === room.name ? room : r));
        io_events_1.send(socket, "come-room", { room: mappers_1.mapRoom(room), user: mappers_1.mapUser(newUser) });
        io_events_1.sendToMembersOfRoom(room, "user-connected", mappers_1.mapUser(newUser));
        io_events_1.sendToAll(socket, "change-room", mappers_1.mapRoom(room));
    });
    socket.on("disconnect-room", (params) => {
        let room = rooms.find(room => room.name === params.roomName);
        if (!room) {
            console.error(socket.id + " :: room not found :: " + params.roomName);
            return;
        }
        if (room.users.length === 1) {
            rooms = rooms.filter(room => room.name !== room.name);
            io_events_1.send(socket, "delete-room", room.name);
            io_events_1.sendToAll(socket, "delete-room", room.name);
            return;
        }
        nextUser(room, socket.id, true);
        room.users = room.users.filter(user => user.name !== params.userName);
        rooms = rooms.map(r => (r.name === room.name ? room : r));
        io_events_1.sendToMembersOfRoom(room, "return-users", mappers_1.mapUsers(room.users));
        io_events_1.send(socket, "change-room", mappers_1.mapRoom(room));
        io_events_1.sendToAll(socket, "change-room", mappers_1.mapRoom(room));
    });
    socket.on("get-users", (roomName) => {
        const room = rooms.find(room => room.name === roomName);
        room
            ? io_events_1.send(socket, "return-users", mappers_1.mapUsers(room.users))
            : io_events_1.sendError(socket, "Упс! Похоже комната была удалена :с");
    });
    socket.on("skip-user", (params) => {
        let room = rooms.find(room => room.name === params.roomName);
        if (!room) {
            console.error(socket.id + " :: room not found :: " + params.roomName);
            return;
        }
        nextUser(room, socket.id, true);
        rooms = rooms.map(x => (x.name === room.name ? room : x));
        io_events_1.sendToMembersOfRoom(room, "return-users", mappers_1.mapUsers(room.users));
    });
    socket.on("send-word", (params) => {
        if (!words.includes(params.word)) {
            io_events_1.sendWordError(socket, `Слово '${params.word}' не доступно! Попробуйте другое слово`);
            return;
        }
        let room = rooms.find(room => room.name === params.roomName);
        if (!room) {
            io_events_1.sendError(socket, "Что-то пошло не так... Попробуйте снова :c");
            return;
        }
        if (room.words.some(x => x.word === params.word)) {
            io_events_1.sendWordError(socket, "Упс! Похоже слово уже было. Попробуйте другое слово");
            return;
        }
        if (room.words.length > 0 &&
            checkLastSymbol(room.words[room.words.length - 1].word, params.word)) {
            io_events_1.sendWordError(socket, "Эй! Слово должно начинаться с последней буквы предыдущего");
            return;
        }
        let user = room.users.find(user => user.socket.id === socket.id);
        if (!user) {
            io_events_1.sendError(socket, "Что-то пошло не так... Попробуйте снова :c");
            return;
        }
        room.words.push({ author: user.name, word: params.word });
        nextUser(room, socket.id, false);
        rooms = rooms.map(x => (x.name === room.name ? room : x));
        io_events_1.sendToMembersOfRoom(room, "update-words", {
            room: mappers_1.mapRoom(room),
            users: mappers_1.mapUsers(room.users)
        });
    });
    socket.on("send-message", (params) => {
        let room = rooms.find(room => room.name === params.roomName);
        if (!room) {
            io_events_1.sendError(socket, "Что-то пошло не так... Попробуйте снова :c");
            return;
        }
        if (params.to) {
            let toUsers = room.users.map(user => params.to.some(toUser => toUser === user.name) ? user : undefined);
            io_events_1.send(socket, "send-message", mappers_1.mapPrivateMessage(params));
            toUsers.forEach(toUser => toUser &&
                toUser.socket.id !== socket.id &&
                io_events_1.send(toUser.socket, "send-message", mappers_1.mapPrivateMessage(params)));
        }
        else {
            io_events_1.sendToMembersOfRoom(room, "send-message", mappers_1.mapMessage(params));
        }
    });
    socket.on("disconnect", () => {
        if (rooms.length === 0) {
            console.log(socket.id + " :: user disconnected");
            return;
        }
        let currentRoom = rooms.find(room => room.users.some(user => user.socket.id === socket.id));
        if (!currentRoom) {
            return;
        }
        if (currentRoom.users.length === 1) {
            rooms = rooms.filter(room => room.name !== currentRoom.name);
            io_events_1.send(socket, "delete-room", currentRoom.name);
            io_events_1.sendToAll(socket, "delete-room", currentRoom.name);
            return;
        }
        nextUser(currentRoom, socket.id, true);
        currentRoom.users = currentRoom.users.filter(user => user.socket.id !== socket.id);
        rooms = rooms.map(room => room.name === currentRoom.name ? currentRoom : room);
        console.log(socket.id + " :: user disconnected");
        io_events_1.sendToMembersOfRoom(currentRoom, "return-users", mappers_1.mapUsers(currentRoom.users));
        io_events_1.sendToAll(socket, "change-room", mappers_1.mapRoom(currentRoom));
    });
});
