import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles"
import { ThemeProvider } from "./context/ThemeContext"
import muiTheme from "./theme/muiTheme"

import App from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <ThemeProvider>
            <MuiThemeProvider theme={muiTheme}>
                <App />
            </MuiThemeProvider>
        </ThemeProvider>
    </BrowserRouter>
)