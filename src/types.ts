export type User = {
  socket: SocketIO.Socket;
  name: string;
  active: boolean;
  score: number;
  color: Color;
};

export type Room = {
  name: string;
  users: User[];
  words: Word[];
  private: boolean;
  password: string;
};

export type RoomParam = {
  roomName: string;
  userName: string;
  private: boolean;
  password: string;
};

export type Word = {
  author: string;
  word: string;
};

export type WordParam = {
  roomName: string;
  word: string;
};

export type MessageParams = {
  roomName: string;
  from: string;
  to: string;
  message: string;
};

export type Color = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};
