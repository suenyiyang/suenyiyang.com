import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import("./pages/Home")).default,
        }),
      },
      {
        path: "blog/:slug",
        lazy: async () => ({
          Component: (await import("./pages/BlogPost")).default,
        }),
      },
      {
        path: "about",
        lazy: async () => ({
          Component: (await import("./pages/About")).default,
        }),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
