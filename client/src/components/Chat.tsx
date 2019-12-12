import React from "react";
import { useState, useEffect } from "react";
import {
  TextField,
  Typography,
  Badge,
  Chip,
  Button,
  LinearProgress
} from "@material-ui/core";
import { User, Room, UpdatedWordList, Message } from "../types";

type Props = {
  socket: SocketIOClient.Socket;
  user: User;
  room: Room;
  updateRoom: (room: Room | undefined) => any;
};

export default function Chat(props: Props) {
  const { socket, user, room, updateRoom } = props;
  const [word, setWord] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [timer, setTimer] = useState(0);
  const [tick, setTick] = useState<any>();
  const [active, setActive] = useState(false);

  useEffect(() => {
    socket.emit("get-users", room.name);
    socket.on("return-users", setUsers);
    socket.on("user-connected", (user: User) => {
      setUsers(users => [...users, user]);
    });
    socket.on("user-disconnected", (id: string) => {
      setUsers(users => users.filter(user => user.id !== id));
    });
    socket.on("update-words", (param: UpdatedWordList) => {
      updateRoom(param.room);
      setUsers(param.users);
    });
    socket.on("send-message", (params: Message) => {
      setMessages(prevs => [...prevs, params]);
    });
    socket.on("word-err", () => continueTimer());
    window.addEventListener("resize", changeMaxHeight);
    return () => window.removeEventListener("resize", changeMaxHeight);
  }, []);

  useEffect(() => {
    if (users.length === 1 && active) stopTimer();
    if (users.length > 1 && users.some(u => user.id === u.id && u.active))
      !active && startTimer();
    const wordsBody = document.getElementById("words-body");
    wordsBody && wordsBody.scrollTo(0, wordsBody.scrollHeight);
  }, [users]);

  useEffect(() => {
    if (timer < 0) {
      stopTimer();
      socket.emit("skip-user", { roomName: room.name, userName: user.name });
    }
  }, [timer]);

  useEffect(() => {
    const messageBody = document.getElementById("message-body");
    messageBody && messageBody.scrollTo(0, messageBody.scrollHeight);
  }, [messages]);

  function startTimer() {
    setActive(true);
    setTimer(100);
    setTick(setInterval(() => setTimer(prev => prev - 2), 1000));
  }

  function continueTimer() {
    setActive(true);
    setTick(setInterval(() => setTimer(prev => prev - 2), 1000));
  }

  function stopTimer() {
    setActive(false);
    clearInterval(tick);
  }

  function sendWord(event: any) {
    event.preventDefault();
    if (!word) {
      return;
    }
    stopTimer();
    if (word === "skip" || word === "пропустить") {
      socket.emit("skip-user", { roomName: room.name, userName: user.name });
      setWord("");
    } else {
      socket.emit("send-word", {
        roomName: room.name,
        word: word
      });
      setWord("");
    }
  }

  function sendMessage(event: any) {
    event.preventDefault();
    let to = message.substring(message.indexOf("<"), message.indexOf(">") + 1);
    let mes = message.replace(to, "").trim();
    if (!mes) {
      return;
    }
    socket.emit("send-message", {
      roomName: room.name,
      from: user.name,
      to: to
        .replace("<", "")
        .replace(">", "")
        .split(","),
      message: mes
    });
    setMessage("");
  }

  const [maxHeight, setMaxHeight] = useState<number | string>("unset");

  function changeMaxHeight() {
    const usersContainer = document.getElementById("users-container");
    usersContainer &&
      setMaxHeight(`calc(100vh - ${usersContainer.offsetHeight}px - 205px)`);
  }

  useEffect(() => changeMaxHeight());

  function getNameActivUser() {
    const active = users.find(u => u.active);
    return active ? `'${active.name}'` : "другого игрока";
  }

  function getUserColors(userName: string) {
    let currentUser = users.find(user => user.name === userName);
    return currentUser ? currentUser.color : {};
  }

  function addUserToSendingMessage(name: string) {
    let to = message.substring(message.indexOf("<") + 1, message.indexOf(">"));
    if (to) {
      let arrTo = to.split(",");
      if (arrTo.includes(name)) {
        arrTo = arrTo.filter(item => item !== name);
        setMessage(
          mes =>
            `${arrTo.length > 0 ? `<${arrTo.join(",")}> ` : ""}${mes.substring(
              mes.indexOf(">") + 2
            )}`
        );
      } else {
        arrTo.push(name);
        setMessage(
          mes => `<${arrTo.join(",")}> ${mes.substring(mes.indexOf(">") + 2)}`
        );
      }
    } else {
      setMessage(`<${name}> ${message}`);
    }
  }

  return (
    <div className="flex column grow">
      <div className="flex row dark-bg">
        <Button
          className="m-10"
          variant="contained"
          color="primary"
          onClick={() => {
            socket.emit("disconnect-room", {
              roomName: room.name,
              userName: user.name
            });
            updateRoom(undefined);
          }}
        >
          Выйти из комнаты
        </Button>
      </div>
      <div
        className="flex row h-center child-m-20-5 dark-bg border-t border-b"
        id="users-container"
      >
        {users.map(user => (
          <div key={user.id}>
            <Badge color="primary" badgeContent={user.score}>
              <Chip
                label={user.name}
                style={{ ...user.color, border: "1px solid" }}
                onClick={() => addUserToSendingMessage(user.name)}
              />
            </Badge>
          </div>
        ))}
      </div>
      <div className="flex grow">
        <div className="flex column dark-bg" style={{ flexGrow: 3 }}>
          <div
            className="message-body"
            style={{
              maxHeight:
                maxHeight !== "unset" ? `calc(${maxHeight} + 4px)` : maxHeight,
              flexGrow: 1
            }}
            id="message-body"
          >
            {messages.map((item, index) => (
              <div
                className="message m-10"
                key={item.author + index}
                style={{ ...getUserColors(item.author) }}
              >
                <Typography color="inherit">
                  <strong>
                    {item.author}
                    {item.to ? ` > ${item.to}` : ""}
                  </strong>
                  <br />
                  {item.message}
                </Typography>
              </div>
            ))}
          </div>
          <form className="input-form" onSubmit={event => sendMessage(event)}>
            <TextField
              placeholder="Введите сообщение..."
              variant="outlined"
              margin="normal"
              value={message}
              onInput={(event: any) => setMessage(event.target.value)}
              style={{ width: "calc(100% - 40px)" }}
            />
          </form>
        </div>
        <div
          className="flex column dark-bg"
          style={{ flexGrow: 1, maxWidth: "450px" }}
        >
          <div className="message-body" style={{ maxHeight }} id="words-body">
            {room.words.map(item => (
              <div
                className="message m-10"
                key={item.word}
                style={{ ...getUserColors(item.author) }}
              >
                <Typography color="inherit">
                  {`${item.author} :: ${item.word}`}
                </Typography>
              </div>
            ))}
          </div>
          {active ? (
            <LinearProgress
              variant="determinate"
              value={timer}
              color="primary"
            />
          ) : (
            <div style={{ minHeight: 4 }}></div>
          )}
          <form className="input-form" onSubmit={event => sendWord(event)}>
            <TextField
              placeholder="Введите слово..."
              disabled={
                !users.some(u => user.id === u.id && u.active) ||
                users.length === 1
              }
              variant="outlined"
              margin="normal"
              value={word}
              onInput={(event: any) =>
                setWord(event.target.value.toLocaleLowerCase().trim())
              }
              style={{ width: "calc(100% - 40px)" }}
            />
            {!users.some(u => user.id === u.id && u.active) ||
            users.length === 1 ? (
              <>
                <div className="overlay shadow"></div>
                <div className="overlay flex center">
                  <Typography variant="h5" color="inherit">
                    {users.length === 1
                      ? "Ожидайте игроков"
                      : `Сейчас ход ${getNameActivUser()}. Пожалуйста подождите`}
                  </Typography>
                </div>
              </>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
