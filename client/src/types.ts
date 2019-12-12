export type User = {
  id: string;
  name: string;
  active: boolean;
  score: number;
  color: Color;
};

export type Room = {
  name: string;
  users: number;
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

export type ConnectToRoomParam = {
  room: Room;
  user: User;
};

export type Word = {
  author: string;
  word: string;
};

export type Message = {
  author: string;
  message: string;
  to: string;
};

export type UpdatedWordList = {
  room: Room;
  users: User[];
};

export type Color = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};
