import React, { useState } from "react";
import { RoomParam, Room } from "../../types";
import { Dialog, DialogTitle, TextField, Button } from "@material-ui/core";

type Props = {
  open: boolean;
  room: Room;
  onClose: (room?: RoomParam) => any;
};

export default function ConnectToRoom(props: Props) {
  const { onClose, open, room } = props;
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  function reset() {
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
          userName &&
            onClose({
              roomName: room.name,
              userName: userName.toLocaleLowerCase().trim(),
              private: room.private,
              password
            });
        }}
      >
        <DialogTitle>Подключение к комнате</DialogTitle>
        <TextField
          autoFocus
          margin="normal"
          fullWidth
          placeholder="Псевдоним"
          required
          value={userName}
          onChange={event => setUserName(event.target.value)}
        />
        {room.private && (
          <TextField
            margin="normal"
            fullWidth
            placeholder="Пароль"
            type="password"
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={
            !(
              userName &&
              userName.length < 11 &&
              (room.private ? password : true)
            )
          }
        >
          Создать
        </Button>
      </form>
    </Dialog>
  );
}
