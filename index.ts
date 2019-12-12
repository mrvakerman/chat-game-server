import { Room, RoomParam, User, WordParam, MessageParams } from "./src/types";
import {
  mapRooms,
  mapRoom,
  mapUser,
  mapUsers,
  mapPrivateMessage,
  mapMessage
} from "./src/mappers";
import { getWords } from "./src/words/words";
import {
  send,
  sendToAll,
  sendToMembersOfRoom,
  sendError,
  sendWordError
} from "./src/io-events";
import { colors } from "./src/colors";

let express = require("express");
let app = express();
let server = require("http").createServer(app);
let io = require("socket.io")(server);

let rooms: Room[] = [];

const words = getWords();

function nextUser(room: Room, id: string, skip: boolean) {
  const index = room.users.findIndex(user => user.socket.id === id);
  if (room.users[index].active) {
    room.users[index].active = false;
    if (!skip) {
      room.users[index].score++;
    }

    if (index < room.users.length - 1) {
      room.users[index + 1].active = true;
    } else {
      room.users[0].active = true;
    }
  }
}

function checkLastSymbol(prevWord: string, newWord: string): boolean {
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
  app.get("/*", (req: any, res: any) => {
    res.sendFile(`${__dirname}/client/build/index.html`);
  });
}

server.listen(8080, () => console.log("Server started on *:8080"));

io.sockets.on("connection", (socket: SocketIO.Socket) => {
  send(socket, "connected");

  socket.on("get-rooms", () => send(socket, "return-rooms", mapRooms(rooms)));

  socket.on("create-room", (params: RoomParam) => {
    if (rooms.find(room => room.name === params.roomName)) {
      sendError(
        socket,
        `Комната с названием '${params.roomName}' уже существует`
      );
      return;
    }

    let user: User = {
      socket,
      name: params.userName,
      active: true,
      score: 0,
      color: colors[Math.floor(Math.random() * Math.floor(colors.length))]
    };

    let room: Room = {
      name: params.roomName,
      users: [user],
      words: [],
      private: params.password ? true : false,
      password: params.password
    };

    rooms.push(room);

    send(socket, "come-room", { room: mapRoom(room), user: mapUser(user) });
    send(socket, "new-room", mapRoom(room));
    sendToAll(socket, "new-room", mapRoom(room));
  });

  socket.on("connect-room", (params: RoomParam) => {
    let room = rooms.find(room => room.name === params.roomName);

    if (!room) {
      console.error(socket.id + " :: room not found :: " + params.roomName);
      return;
    }

    if (room.users.some(user => user.name === params.userName)) {
      sendError(socket, `В комнате уже есть '${params.userName}'`);
      return;
    }

    if (room.private && room.password !== params.password) {
      sendError(socket, "Неверный пароль");
      return;
    }

    let newUser: User = {
      socket,
      name: params.userName,
      active: !room.users.some(user => user.active === true),
      score: 0,
      color: colors[Math.floor(Math.random() * Math.floor(colors.length))]
    };

    room.users.push(newUser);

    rooms = rooms.map(r => (r.name === room!.name ? room! : r));

    send(socket, "come-room", { room: mapRoom(room), user: mapUser(newUser) });
    sendToMembersOfRoom(room, "user-connected", mapUser(newUser));
    sendToAll(socket, "change-room", mapRoom(room));
  });

  socket.on("disconnect-room", (params: RoomParam) => {
    let room = rooms.find(room => room.name === params.roomName);

    if (!room) {
      console.error(socket.id + " :: room not found :: " + params.roomName);
      return;
    }

    if (room.users.length === 1) {
      rooms = rooms.filter(room => room.name !== room!.name);
      send(socket, "delete-room", room.name);
      sendToAll(socket, "delete-room", room.name);
      return;
    }

    nextUser(room, socket.id, true);

    room.users = room.users.filter(user => user.name !== params.userName);

    rooms = rooms.map(r => (r.name === room!.name ? room! : r));

    sendToMembersOfRoom(room, "return-users", mapUsers(room.users));
    send(socket, "change-room", mapRoom(room));
    sendToAll(socket, "change-room", mapRoom(room));
  });

  socket.on("get-users", (roomName: string) => {
    const room = rooms.find(room => room.name === roomName);
    room
      ? send(socket, "return-users", mapUsers(room.users))
      : sendError(socket, "Упс! Похоже комната была удалена :с");
  });

  socket.on("skip-user", (params: RoomParam) => {
    let room = rooms.find(room => room.name === params.roomName);

    if (!room) {
      console.error(socket.id + " :: room not found :: " + params.roomName);
      return;
    }

    nextUser(room, socket.id, true);
    rooms = rooms.map(x => (x.name === room!.name ? room! : x));

    sendToMembersOfRoom(room, "return-users", mapUsers(room.users));
  });

  socket.on("send-word", (params: WordParam) => {
    if (!words.includes(params.word)) {
      sendWordError(
        socket,
        `Слово '${params.word}' не доступно! Попробуйте другое слово`
      );
      return;
    }

    let room = rooms.find(room => room.name === params.roomName);

    if (!room) {
      sendError(socket, "Что-то пошло не так... Попробуйте снова :c");
      return;
    }

    if (room.words.some(x => x.word === params.word)) {
      sendWordError(
        socket,
        "Упс! Похоже слово уже было. Попробуйте другое слово"
      );
      return;
    }

    if (
      room.words.length > 0 &&
      checkLastSymbol(room.words[room.words.length - 1].word, params.word)
    ) {
      sendWordError(
        socket,
        "Эй! Слово должно начинаться с последней буквы предыдущего"
      );
      return;
    }

    let user = room.users.find(user => user.socket.id === socket.id);

    if (!user) {
      sendError(socket, "Что-то пошло не так... Попробуйте снова :c");
      return;
    }

    room.words.push({ author: user.name, word: params.word });
    nextUser(room, socket.id, false);
    rooms = rooms.map(x => (x.name === room!.name ? room! : x));

    sendToMembersOfRoom(room, "update-words", {
      room: mapRoom(room),
      users: mapUsers(room.users)
    });
  });

  socket.on("send-message", (params: MessageParams) => {
    let room = rooms.find(room => room.name === params.roomName);

    if (!room) {
      sendError(socket, "Что-то пошло не так... Попробуйте снова :c");
      return;
    }

    if (params.to) {
      let toUsers = room.users.map(user =>
        params.to.some(toUser => toUser === user.name) ? user : undefined
      );
      send(socket, "send-message", mapPrivateMessage(params));
      toUsers.forEach(
        toUser =>
          toUser &&
          toUser.socket.id !== socket.id &&
          send(toUser.socket, "send-message", mapPrivateMessage(params))
      );
    } else {
      sendToMembersOfRoom(room, "send-message", mapMessage(params));
    }
  });

  socket.on("disconnect", () => {
    if (rooms.length === 0) {
      console.log(socket.id + " :: user disconnected");
      return;
    }

    let currentRoom = rooms.find(room =>
      room.users.some(user => user.socket.id === socket.id)
    );

    if (!currentRoom) {
      return;
    }

    if (currentRoom.users.length === 1) {
      rooms = rooms.filter(room => room.name !== currentRoom!.name);
      send(socket, "delete-room", currentRoom.name);
      sendToAll(socket, "delete-room", currentRoom.name);
      return;
    }

    nextUser(currentRoom, socket.id, true);

    currentRoom.users = currentRoom.users.filter(
      user => user.socket.id !== socket.id
    );

    rooms = rooms.map(room =>
      room.name === currentRoom!.name ? currentRoom! : room
    );

    console.log(socket.id + " :: user disconnected");

    sendToMembersOfRoom(
      currentRoom,
      "return-users",
      mapUsers(currentRoom.users)
    );
    sendToAll(socket, "change-room", mapRoom(currentRoom));
  });
});
