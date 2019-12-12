import React, { useEffect, useState } from "react";
import { Room, RoomParam, User, ConnectToRoomParam } from "../types";
import {
  Button,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  Badge
} from "@material-ui/core";
import { Add, Lock, LockOpen } from "@material-ui/icons";
import AddRoom from "./dialogs/AddRoom";
import ConnectToRoom from "./dialogs/ConnectToRoom";

type Props = {
  socket: SocketIOClient.Socket;
  current: Room | undefined;
};

type Events = {
  changeRoom: (room: Room | undefined, user: User | undefined) => any;
};

export default function Rooms(props: Props & Events) {
  const { socket, current, changeRoom } = props;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [create, setCreate] = useState(false);
  const [roomForConnect, setRoomForConnect] = useState<Room>();

  useEffect(() => {
    socket.on("connected", () => socket.emit("get-rooms"));
    socket.on("return-rooms", (rooms: Room[]) => {
      setRooms(rooms);
      changeRoom(undefined, undefined);
    });
    socket.on("new-room", (room: Room) => setRooms(rooms => [...rooms, room]));
    socket.on("change-room", (room: Room) =>
      setRooms(rooms => rooms.map(r => (r.name === room.name ? room : r)))
    );
    socket.on("delete-room", (roomName: string) => {
      setRooms(rooms => rooms.filter(room => room.name !== roomName));
      if (current && roomName === current.name) {
        changeRoom(undefined, undefined);
      }
    });
    socket.on("come-room", (param: ConnectToRoomParam) => {
      setRooms(rooms =>
        rooms.map(room => (room.name === param.room.name ? param.room : room))
      );
      changeRoom(param.room, param.user);
    });
  }, []);

  return (
    <>
      <AddRoom
        open={create}
        onClose={(param?: RoomParam) => {
          param && socket.emit("create-room", param);
          setCreate(false);
        }}
      />
      {roomForConnect && (
        <ConnectToRoom
          open={roomForConnect !== undefined}
          room={roomForConnect}
          onClose={(param?: RoomParam) => {
            param && socket.emit("connect-room", param);
            setRoomForConnect(undefined);
          }}
        />
      )}
      <Drawer variant="permanent" className="drawer">
        <div className="flex row v-center">
          <Typography variant="h6" className="m-10">
            Список комнат
          </Typography>
          {!current && (
            <IconButton
              color="primary"
              onClick={() => setCreate(true)}
              size="small"
              className="m-10"
            >
              <Add />
            </IconButton>
          )}
        </div>
        <List>
          {rooms.map(room => (
            <ListItem button key={room.name}>
              <ListItemIcon>
                <Badge color="primary" badgeContent={room.users}>
                  {room.private ? <Lock /> : <LockOpen />}
                </Badge>
              </ListItemIcon>
              <Button
                variant="contained"
                color={
                  current && current.name === room.name
                    ? "primary"
                    : "secondary"
                }
                fullWidth
                onClick={() => !current && setRoomForConnect(room)}
              >
                {room.name}
              </Button>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}
