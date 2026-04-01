// index.js (Proxy en Render - CON REWRITE DE URLs PARA IMÁGENES)

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
// PASO 1: REDIRECCIÓN EXPLÍCITA
// Si el usuario accede a la raíz del proxy ('/'), lo redirigimos
// a la ruta base de la aplicación.
// ----------------------------------------------------------------
app.get("/", (req, res) => {
  console.log("Redirecting root to base path...");
  res.redirect(302, VPS_APP_BASE_PATH + "/");
});

// ----------------------------------------------------------------
// PASO 2: PROXY CON REWRITE DE URLs
// Interceptamos las respuestas de texto (HTML, CSS, JS) para
// reemplazar las URLs absolutas del VPS (http://195.200.0.39)
// por rutas relativas. Esto soluciona el problema de "mixed content"
// donde el navegador bloquea recursos HTTP en una página HTTPS.
// Las respuestas binarias (imágenes, fuentes, etc.) pasan sin modificar.
// ----------------------------------------------------------------
app.use(
  "/",
  createProxyMiddleware({
    target: VPS_TARGET,
    changeOrigin: true,
    selfHandleResponse: true,
    on: {
      proxyRes: responseInterceptor(
        async (responseBuffer, proxyRes, req, res) => {
          // Reescribir headers de Location en redirects del VPS
          if (proxyRes.headers["location"]) {
            const newLocation = proxyRes.headers["location"].replace(
              /https?:\/\/195\.200\.0\.39/g,
              ""
            );
            res.setHeader("location", newLocation);
          }

          const contentType = proxyRes.headers["content-type"] || "";

          // Solo reescribir respuestas de texto (HTML, CSS, JS, JSON, XML)
          if (
            contentType.includes("text/html") ||
            contentType.includes("text/css") ||
            contentType.includes("application/javascript") ||
            contentType.includes("text/javascript") ||
            contentType.includes("application/json") ||
            contentType.includes("text/xml") ||
            contentType.includes("application/xml")
          ) {
            let body = responseBuffer.toString("utf8");

            // Reemplazar URLs absolutas del VPS por rutas relativas
            // para que las peticiones pasen por el proxy (HTTPS)
            body = body.replaceAll("http://195.200.0.39", "");
            body = body.replaceAll("https://195.200.0.39", "");
            body = body.replaceAll("//195.200.0.39", "");

            return body;
          }

          // Contenido binario (imágenes, fuentes, etc.) pasa sin modificar
          return responseBuffer;
        }
      ),
    },
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy con rewrite de URLs escuchando en el puerto ${PORT}`);
});
