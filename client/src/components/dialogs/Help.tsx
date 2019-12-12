import React from "react";
import { RoomParam } from "../../types";
import {
  Dialog,
  DialogTitle,
  Button,
  Typography,
  DialogContent,
  DialogActions
} from "@material-ui/core";

type Props = {
  open: boolean;
  onClose: (room?: RoomParam) => any;
};

export default function HelpDlg(props: Props) {
  const { onClose, open } = props;

  return (
    <Dialog onClose={() => onClose()} open={open}>
      <DialogTitle>
        <Typography variant="h4">Правила</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography align="justify">
          Чтобы начать игру, необходимо подключиться к комнате или создать ее.
        </Typography>
        <br />
        <Typography align="justify">
          Игроки должны отравлять слова, каждое из которых начинается с
          последней буквы предыдущего слова. В противном случае, либо при
          отсутсвии слова в списке разрешенных (только существительные в
          единственном числе), будет выведено сообщение об ошибке. Если игрок не
          может придумать слово, то он может отправить слово "skip" или
          "пропустить", чтобы пропустить ход. Если игрок не отправит ничего за
          50 секунд, то он автоматически пропустит ход.
        </Typography>
        <br />
        <Typography align="justify">
          Для отправки приватного сообщения необходимо кликнуть по иконке
          пользователя либо вписать в поле сообщения его никнейм. Например:
          "#никнейм:: привет".
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={() => onClose()}>
          Ок
        </Button>
      </DialogActions>
    </Dialog>
  );
}
