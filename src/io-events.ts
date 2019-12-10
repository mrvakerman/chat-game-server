import { Room } from "./types";

export function send(socket: SocketIO.Socket, event: string, value?: any) {
  console.log(`${socket.id} :: ${event} :: ${value}`);
  socket.emit(event, value);
}

export function sendToAll(socket: SocketIO.Socket, event: string, value?: any) {
  console.log(`To all :: ${event} :: ${value}`);
  socket.broadcast.emit(event, value);
}

export function sendToMembersOfRoom(
  room: Room,
  event: string,
  value?: any,
  mapFn?: (value: any) => any
) {
  room.users.forEach(user =>
    send(user.socket, event, mapFn ? mapFn(value) : value)
  );
}

export function sendError(socket: SocketIO.Socket, value: string) {
  socket.emit("err", value);
}

export function sendWordError(socket: SocketIO.Socket, value: string) {
  socket.emit("word-err", value);
}