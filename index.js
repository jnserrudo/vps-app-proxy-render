// index.js (Proxy en Render - STREAMING + REWRITE SELECTIVO)

import express from "express";
import {
  createProxyMiddleware,
  responseInterceptor,
} from "http-proxy-middleware";
import cors from "cors";

const app = express();
app.use(cors());

const VPS_TARGET = "http://195.200.0.39";
const VPS_APP_BASE_PATH = "/mra/guia_interactiva";

// ----------------------------------------------------------------
// Extensiones que se STREAMEAN directo (sin bufferear ni modificar).
// Esto incluye assets pesados: imágenes, fuentes, JS, CSS, etc.
// ----------------------------------------------------------------
const STREAM_EXTENSIONS =
  /\.(js|mjs|css|map|jpg|jpeg|png|gif|webp|svg|ico|avif|woff|woff2|ttf|eot|otf|mp4|mp3|wav|ogg|pdf|zip|gz|br)$/i;

// ----------------------------------------------------------------
// PROXY 1: STREAMING (sin buffering)
// Para archivos binarios y assets grandes.
// Pasa los bytes directo del VPS al cliente sin esperar.
// ----------------------------------------------------------------
const streamProxy = createProxyMiddleware({
  target: VPS_TARGET,
  changeOrigin: true,
  on: {
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
