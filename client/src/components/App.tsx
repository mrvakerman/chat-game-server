import React, { useState } from "react";
import socketIOClient from "socket.io-client";
import { Room, User } from "../types";
import { Typography } from "@material-ui/core";
import Rooms from "./Rooms";
import Snack from "./common/Snack";
import Chat from "./Chat";
import { Help } from "@material-ui/icons";
import HelpDlg from "./dialogs/Help";

const socket = socketIOClient("localhost:8080");

export default function App() {
  const [room, setRoom] = useState<Room>();
  const [user, setUser] = useState<User>();
  const [help, setHelp] = useState(false);

  return (
    <div className="flex column grow">
      <div className="flex row v-center h-between header">
        <div className="flex center">
          <Typography variant="h6" color="inherit">
            Чат-игра "СЛОВА"
          </Typography>
          <Help
            style={{ marginLeft: 20, cursor: "pointer" }}
            onClick={() => setHelp(true)}
          />
        </div>
        <Typography variant="h6" color="inherit">
          {room &&
            user &&
            `Комната :: ${room.name} - Никнейм :: ${user.name}`}
        </Typography>
      </div>
      <div className="flex row grow">
        <Rooms
          socket={socket}
          current={room}
          changeRoom={(room, user) => {
            setRoom(room);
            setUser(user);
          }}
        />
        {room && user ? (
          <Chat socket={socket} user={user} room={room} updateRoom={setRoom} />
        ) : (
          <div className="flex grow center dark-bg">
            <Typography variant="h4" color="textPrimary">
              Выберите или создайте комнату :с
            </Typography>
          </div>
        )}
      </div>
      <Snack socket={socket} />
      <HelpDlg open={help} onClose={() => setHelp(false)} />
    </div>
  );
}
