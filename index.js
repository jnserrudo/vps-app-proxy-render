// index.js (Proxy en Render - VERSIÓN FINAL Y CORRECTA)

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_TARGET = "http://195.200.0.39";
const VPS_APP_BASE_PATH = "/mra/guia_interactiva";

app.use(
  "/", // Capturamos todas las peticiones
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug", // Te mostrará en los logs de Render qué está haciendo el proxy

    pathRewrite: {
      // ESTA ES LA ÚNICA REGLA QUE NECESITAS Y LA MÁS IMPORTANTE:
      // "Cuando recibas una petición que empiece con '/mra/guia_interactiva',
      // bórra esa parte antes de enviarla al VPS".
      [`^${VPS_APP_BASE_PATH}`]: "",
    },

    onError: (err, req, res) => {
      console.error("Error de proxy:", err);
      // No envíes una respuesta aquí para dejar que el proxy lo maneje si puede
    },
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy corregido escuchando en el puerto ${PORT}`);
});
