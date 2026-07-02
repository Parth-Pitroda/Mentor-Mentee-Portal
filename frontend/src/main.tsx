import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { NotificationProvider } from "@/components/NotificationProvider";
import App from "./App";
import "@/src/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
