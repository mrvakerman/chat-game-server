import React, { useState } from "react";
import { RoomParam } from "../../types";
import { Dialog, DialogTitle, TextField, Button } from "@material-ui/core";

type Props = {
  open: boolean;
  onClose: (room?: RoomParam) => any;
};

export default function AddRoom(props: Props) {
  const { onClose, open } = props;
  const [roomName, setRoomName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  function reset() {
    setRoomName("");
    setUserName("");
    setPassword("");
  }

  return (
    <Dialog
      onClose={() => {
        onClose();
        reset();
      }}
      open={open}
    >
      <form
        className="flex column m-20"
        onSubmit={event => {
          event.preventDefault();
          roomName &&
            userName &&
            onClose({
              roomName: roomName.toLocaleLowerCase().trim(),
              userName: userName.toLocaleLowerCase().trim(),
              private: password ? true : false,
              password
            });
        }}
      >
        <DialogTitle>Новая комната</DialogTitle>
        <TextField
          autoFocus
          margin="normal"
          fullWidth
          placeholder="Навзвание комнаты"
          required
          value={roomName}
          onInput={(event: any) => setRoomName(event.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          placeholder="Псевдоним"
          required
          value={userName}
          onInput={(event: any) => setUserName(event.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          placeholder="Пароль"
          type="password"
          value={password}
          onInput={(event: any) => setPassword(event.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={
            !(
              roomName &&
              roomName.length < 11 &&
              userName &&
              userName.length < 11
            )
          }
        >
          Создать
        </Button>
      </form>
    </Dialog>
  );
}
