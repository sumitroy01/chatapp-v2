// src/main.jsx
import ReactDOM from "react-dom/client";
import React, { useEffect, useMemo, useState } from "react";

import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-center" />
    </BrowserRouter>
  </React.StrictMode>
);
