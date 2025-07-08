// index.js (Proxy en Render - VERSIÓN FINAL-FINAL-CORREGIDA)

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

    // Lógica de reescritura de ruta - LA VERSIÓN CORRECTA
    pathRewrite: (path, req) => {
      // Caso 1: Si la petición es a la raíz del sitio ('/')...
      // ...la redirigimos a la raíz de nuestra aplicación en el VPS.
      if (path === "/") {
        return VPS_APP_BASE_PATH + "/";
      }

      // Caso 2: Para cualquier otra petición (ej: /mra/guia_interactiva/assets/...),
      // ya viene con la ruta correcta desde el navegador. La pasamos tal cual.
      return path;
    },
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy final y simplificado escuchando en el puerto ${PORT}`);
});