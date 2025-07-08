// index.js (Proxy en Render - VERSIÓN FINAL-FINAL)

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_TARGET = "http://195.200.0.39";
const VPS_APP_BASE_PATH = "/mra/guia_interactiva";

app.use(
  "/",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",

    // Lógica de reescritura de ruta:
    // Toma la ruta de la petición original (path) y le concatena la base de la app
    pathRewrite: (path, req) => {
      const newPath = VPS_APP_BASE_PATH + path;
      console.log(`Rewriting path from "${path}" to "${newPath}"`);
      return newPath;
    },
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy final escuchando en el puerto ${PORT}`);
});
