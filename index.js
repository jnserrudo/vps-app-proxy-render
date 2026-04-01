// index.js (Proxy en Render - VERSIÓN SIMPLE QUE FUNCIONABA)

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_TARGET = "http://195.200.0.39";
const VPS_APP_BASE_PATH = "/mra/guia_interactiva";

// ----------------------------------------------------------------
// REDIRECCIÓN: Raíz -> Aplicación
// ----------------------------------------------------------------
app.get("/", (req, res) => {
  console.log("Redirecting root to base path...");
  res.redirect(302, VPS_APP_BASE_PATH + "/");
});

// ----------------------------------------------------------------
// PROXY SIMPLE - SIN MODIFICAR RUTAS
// ----------------------------------------------------------------
app.use(
  "/",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
    
    // NO usar pathRewrite - las rutas deben pasar tal cual
    
    // Asegurar que los headers sean correctos
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] ${req.url}`);
    }
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy final con redirección escuchando en el puerto ${PORT}`);
});