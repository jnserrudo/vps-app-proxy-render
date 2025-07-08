// index.js (Proxy en Render - LA SOLUCIÓN DEFINITIVA)

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_TARGET = "http://195.200.0.39";
const VPS_APP_BASE_PATH = "/mra/guia_interactiva";

// ----------------------------------------------------------------
// PASO 1: REDIRECCIÓN EXPLÍCITA
// Si el usuario accede a la raíz del proxy ('/'), lo redirigimos
// a la ruta base de la aplicación.
// ----------------------------------------------------------------
app.get("/", (req, res) => {
  console.log("Redirecting root to base path...");
  // Usamos 302 (Temporal) o 301 (Permanente)
  res.redirect(302, VPS_APP_BASE_PATH + "/");
});

// ----------------------------------------------------------------
// PASO 2: PROXY SIMPLE
// Ahora que el navegador tiene la URL correcta, el proxy solo
// necesita pasar las peticiones al VPS sin modificar las rutas.
// ----------------------------------------------------------------
app.use(
  "/",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
    // ¡No necesitamos pathRewrite! Las rutas del navegador ya coinciden con las del VPS.
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy final con redirección escuchando en el puerto ${PORT}`);
});
