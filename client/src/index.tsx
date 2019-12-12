import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "./components/App";
import { ThemeProvider } from "@material-ui/styles";
import { createMuiTheme } from "@material-ui/core";
import { grey, lime } from "@material-ui/core/colors";

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: lime,
    secondary: grey
  }
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>,
  document.getElementById("root")
);
