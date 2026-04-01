// index.js (Proxy en Render - AJUSTADO PARA TU NGINX)

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_IP = "195.200.0.39";
const VPS_TARGET = `http://${VPS_IP}`;

// ----------------------------------------------------------------
// REDIRECCIÓN: Raíz -> Aplicación React
// ----------------------------------------------------------------
app.get("/", (req, res) => {
  console.log("✅ Redirecting root to /mra/guia_interactiva/");
  res.redirect(302, "/mra/guia_interactiva/");
});

// ----------------------------------------------------------------
// PROXY PARA /mra/guia_interactiva/ (Tu aplicación React)
// ----------------------------------------------------------------
app.use(
  "/mra/guia_interactiva",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
    
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY APP] ${req.method} ${req.url} -> ${VPS_TARGET}${req.url}`);
    },
    
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[RESPONSE] ${req.url} - Status: ${proxyRes.statusCode}`);
      // Agregar CORS si no existe
      if (!proxyRes.headers['access-control-allow-origin']) {
        proxyRes.headers['access-control-allow-origin'] = '*';
      }
    },
    
    onError: (err, req, res) => {
      console.error('[PROXY ERROR]', err.message);
      res.status(502).send('Error conectando con el VPS');
    }
  })
);

// ----------------------------------------------------------------
// PROXY PARA /museo (Si lo necesitas)
// ----------------------------------------------------------------
app.use(
  "/museo",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
  })
);

// ----------------------------------------------------------------
// PROXY PARA /museo-ra/ (Realidad Aumentada)
// ----------------------------------------------------------------
app.use(
  "/museo-ra",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
  })
);

// ----------------------------------------------------------------
// FALLBACK: Cualquier otra ruta
// ----------------------------------------------------------------
app.use(
  "/",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy HTTPS escuchando en puerto ${PORT}`);
  console.log(`📡 VPS Target: ${VPS_TARGET}`);
  console.log(`✅ Rutas configuradas:`);
  console.log(`   - / → /mra/guia_interactiva/`);
  console.log(`   - /mra/guia_interactiva/* → ${VPS_TARGET}/mra/guia_interactiva/*`);
  console.log(`   - /museo/* → ${VPS_TARGET}/museo/*`);
  console.log(`   - /museo-ra/* → ${VPS_TARGET}/museo-ra/*`);
});