import React, { useEffect, useState } from "react";
import { Snackbar, SnackbarContent, IconButton } from "@material-ui/core";
import { Close, Error, CheckCircle } from "@material-ui/icons";

type Props = {
  socket: SocketIOClient.Socket;
};

export default function Snack(props: Props) {
  const { socket } = props;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [variant, setVariant] = useState<"#43a047" | "#d32f2f">();

  useEffect(() => {
    socket.on("err", (message: string) => showSnack("#d32f2f", message));
    socket.on("word-err", (message: string) => showSnack("#d32f2f", message));
  }, []);

  function showSnack(variant: "#43a047" | "#d32f2f", message: string) {
    setVariant(variant);
    setMessage(message);
    setOpen(true);
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={() => setOpen(false)}
    >
      <SnackbarContent
        style={{ background: variant, color: "white" }}
        message={
          <span className="flex row v-center">
            {variant === "#d32f2f" && <Error className="m-10" />}
            {variant === "#43a047" && <CheckCircle className="m-10" />}
            {message}
          </span>
        }
        action={[
          <IconButton
            key={variant}
            color="inherit"
            onClick={() => setOpen(false)}
          >
            <Close />
          </IconButton>
        ]}
      />
    </Snackbar>
  );
}
