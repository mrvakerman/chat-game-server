import { Room, User, MessageParams } from "./types";

export function mapRooms(rooms: Room[]) {
  return rooms.map(mapRoom);
}

export function mapRoom(room: Room) {
  return { ...room, users: room.users.length, password: "" };
}

export function mapUsers(users: User[]) {
  return users.map(mapUser);
}

export function mapUser(user: User) {
  return {
    id: user.socket.id,
    name: user.name,
    active: user.active,
    score: user.score,
    color: user.color
  };
}

export function mapMessage(params: MessageParams) {
  return { author: params.from, message: params.message };
}

export function mapPrivateMessage(params: MessageParams) {
  return {
    author: params.from,
    message: params.message,
    to: params.to
  };
}
