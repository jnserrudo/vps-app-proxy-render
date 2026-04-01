// index.js (Proxy en Render - VERSIÓN SIMPLE Y SEGURA)

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_TARGET = "http://195.200.0.39";
const VPS_APP_BASE_PATH = "/mra/guia_interactiva";

// ----------------------------------------------------------------
// ÚNICA REDIRECCIÓN: Raíz -> Tu App
// ----------------------------------------------------------------
app.get("/", (req, res) => {
  console.log("🔄 Redirecting to /mra/guia_interactiva/");
  res.redirect(302, VPS_APP_BASE_PATH + "/");
});

// ----------------------------------------------------------------
// ÚNICO PROXY: Solo para tu app /mra/guia_interactiva
// ----------------------------------------------------------------
app.use(
  VPS_APP_BASE_PATH,
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
    
    // SIN pathRewrite - pasar tal cual
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] ${req.method} ${req.url}`);
    },
    
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[RESPONSE] ${req.url} - ${proxyRes.statusCode}`);
      
      // CORS solo para tu app
      if (!proxyRes.headers['access-control-allow-origin']) {
        proxyRes.headers['access-control-allow-origin'] = '*';
      }
    },
    
    onError: (err, req, res) => {
      console.error('[PROXY ERROR]', err);
      res.status(502).send('Error temporal');
    }
  })
);

// ----------------------------------------------------------------
// NADA MÁS - No interceptar otras rutas
// ----------------------------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy SIMPLE en puerto ${PORT}`);
  console.log(`📡 Target: ${VPS_TARGET}`);
  console.log(`✅ Solo maneja: / -> ${VPS_APP_BASE_PATH}/`);
  console.log(`🎯 Proxy específico: ${VPS_APP_BASE_PATH}/*`);
});