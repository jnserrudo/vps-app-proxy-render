// index.js (Proxy en Render - SOLUCIÓN DEFINITIVA)

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_TARGET = "http://195.200.0.39";

// ----------------------------------------------------------------
// PROBLEMA 1: Redirección de raíz (para que cargue imágenes)
// ----------------------------------------------------------------
app.get("/", (req, res) => {
  console.log("🔄 Redirecting root to /mra/guia_interactiva/");
  res.redirect(302, "/mra/guia_interactiva/");
});

// ----------------------------------------------------------------
// PROBLEMA 2: Proxy específico para /mra/guia_interactiva/
// ----------------------------------------------------------------
app.use(
  "/mra/guia_interactiva",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug",
    
    // IMPORTANTE: NO reescribir rutas
    pathRewrite: {
      '^/mra/guia_interactiva': '/mra/guia_interactiva'
    },
    
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY APP] ${req.method} ${req.url}`);
      
      // Headers para que el VPS sepa que viene de HTTPS
      proxyReq.setHeader('X-Forwarded-Proto', 'https');
      proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
    },
    
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[RESPONSE APP] ${req.url} - ${proxyRes.statusCode}`);
      
      // CORS para imágenes
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
// Proxy para otras rutas (museo, museo-ra, etc.)
// ----------------------------------------------------------------
app.use(
  "/",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    logLevel: "debug"
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy corregido en puerto ${PORT}`);
  console.log(`📡 Target: ${VPS_TARGET}`);
  console.log(`✅ Redirección: / -> /mra/guia_interactiva/`);
  console.log(`🎯 Proxy específico: /mra/guia_interactiva/*`);
});