// index.js (Proxy en Render - STREAMING + REWRITE SELECTIVO)

import express from "express";
import {
  createProxyMiddleware,
  responseInterceptor,
} from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());
// =========================================================================
// MEJORA CLAVE: Uso de Variables de Entorno.
// Si no se define VPS_IP en el panel de Render, usará la vieja por defecto,
// garantizando que el VPS viejo NO SE ROMPA.
// =========================================================================
const TARGET_IP = process.env.VPS_IP || "195.200.0.39"; 
const VPS_TARGET = `http://${TARGET_IP}`;
const VPS_APP_BASE_PATH = "/mra/guia_interactiva";

console.log(`[INIT] Proxy arrancando. Apuntando al VPS: ${VPS_TARGET}`);

// ----------------------------------------------------------------
// Extensiones que se STREAMEAN directo (sin bufferear ni modificar).
// Assets pesados: imágenes, fuentes, JS, etc.
// NOTA: CSS NO va acá porque puede contener background-image con URLs
// absolutas del VPS que necesitan ser reescritas.
// ----------------------------------------------------------------
const STREAM_EXTENSIONS =
  /\.(map|jpg|jpeg|png|gif|webp|svg|ico|avif|woff|woff2|ttf|eot|otf|mp4|mp3|wav|ogg|pdf|zip|gz|br)$/i;

// ----------------------------------------------------------------
// PROXY 1: STREAMING (sin buffering)
// Para archivos binarios y assets grandes.
// Pasa los bytes directo del VPS al cliente sin esperar.
// ----------------------------------------------------------------
const streamProxy = createProxyMiddleware({
  target: VPS_TARGET,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes, req, res) => {
      // Desactivar caché para que el navegador siempre pida la versión
      // más nueva del VPS (evita ver assets desactualizados)
      proxyRes.headers["cache-control"] = "no-cache, no-store, must-revalidate";
      proxyRes.headers["pragma"] = "no-cache";
      proxyRes.headers["expires"] = "0";
    },
    error: (err, req, res) => {
      console.error("[Stream Proxy Error]", req.path, err.message);
      if (!res.headersSent) {
        res.status(502).send("Proxy error");
      }
    },
  },
});

// ----------------------------------------------------------------
// PROXY 2: REWRITE (con buffering selectivo)
// Solo para respuestas de texto (HTML, JSON de APIs).
// Reescribe http://195.200.0.39 → rutas relativas para evitar
// mixed content en HTTPS.
// ----------------------------------------------------------------
const rewriteProxy = createProxyMiddleware({
  target: VPS_TARGET,
  changeOrigin: true,
  selfHandleResponse: true,
  on: {
    proxyRes: responseInterceptor(
      async (responseBuffer, proxyRes, req, res) => {
        // Desactivar caché también en respuestas reescritas
        res.setHeader("cache-control", "no-cache, no-store, must-revalidate");
        res.setHeader("pragma", "no-cache");
        res.setHeader("expires", "0");

        // Corregir headers de Location en redirects
        if (proxyRes.headers["location"]) {
          const newLoc = proxyRes.headers["location"].replace(
            /https?:\/\/195\.200\.0\.39/g,
            ""
          );
          res.setHeader("location", newLoc);
        }

        const contentType = proxyRes.headers["content-type"] || "";
        const isText =
          contentType.includes("text/") ||
          contentType.includes("application/javascript") ||
          contentType.includes("application/json") ||
          contentType.includes("application/xml");

        if (isText) {
          let body = responseBuffer.toString("utf8");
          body = body.replaceAll("http://195.200.0.39", "");
          body = body.replaceAll("https://195.200.0.39", "");
          body = body.replaceAll("//195.200.0.39", "");
          return body;
        }

        return responseBuffer;
      }
    ),
    error: (err, req, res) => {
      console.error("[Rewrite Proxy Error]", req.path, err.message);
      if (!res.headersSent) {
        res.status(502).send("Proxy error");
      }
    },
  },
});

// ----------------------------------------------------------------
// REDIRECCIÓN: raíz → ruta base de la app
// ----------------------------------------------------------------
app.get("/", (req, res) => {
  console.log("Redirecting root to base path...");
  res.redirect(302, VPS_APP_BASE_PATH + "/");
});

// ----------------------------------------------------------------
// ROUTER: elige proxy según el tipo de archivo
// - Archivos con extensión binaria/asset → STREAMING (rápido)
// - HTML, API endpoints, rutas sin extensión → REWRITE (modifica URLs)
// ----------------------------------------------------------------
app.use("/", (req, res, next) => {
  if (STREAM_EXTENSIONS.test(req.path)) {
    return streamProxy(req, res, next);
  }
  return rewriteProxy(req, res, next);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy (stream + rewrite) escuchando en el puerto ${PORT}`);
});
