// index.js (o server.js) para tu proxy en Render

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors'; // Agregamos cors para manejar posibles problemas

const app = express();

// Middleware CORS para el proxy de Render
// Esto permite que cualquier origen (incluyendo tu propio dominio de Render) acceda al proxy.
// Puedes restringirlo si lo necesitas, pero para pruebas, '*' es suficiente.
app.use(cors());

// ----------------------------------------------------------------------
// CONFIGURACIÓN DEL PROXY PARA TU APP DEL VPS
// ----------------------------------------------------------------------

const VPS_TARGET = 'http://195.200.0.39'; // IP de tu VPS
// La ruta base de tu app en el VPS es '/mra/guia_interactiva'.
// Importante: Asegúrate de que tu backend de Express en el VPS esté sirviendo
// el frontend desde /mra/guia_interactiva/ y que las rutas internas de tu
// aplicación React también sean relativas o absolutas a esa base.
const VPS_APP_BASE_PATH = '/mra/guia_interactiva';

// Esta será la URL pública en Render que el cliente usará.
// Por ejemplo, si el dominio de Render es 'mi-proxy.onrender.com',
// la URL de tu app será 'https://mi-proxy.onrender.com/'
// NOTA: Si pones un prefijo aquí, la URL final tendrá ese prefijo.
// Dado que tu app de VPS ya usa '/mra/guia_interactiva', vamos a intentar
// mapear la raíz de Render directamente a esa ruta base del VPS.
const PROXY_PATH_PREFIX_RENDER = '/'; // La raíz de tu app de Render

app.use(
    PROXY_PATH_PREFIX_RENDER, // Captura todas las solicitudes
    createProxyMiddleware({
      target: VPS_TARGET,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        // Reemplaza la raíz de Render ('/') por la ruta base de la app en el VPS
        const newPath = path.replace(new RegExp(`^${PROXY_PATH_PREFIX_RENDER}`), VPS_APP_BASE_PATH);
  
        // Si el resultado es solo la ruta base sin barra, se la añadimos.
        // Esto evita la redirección 301 del servidor Express.
        if (newPath === VPS_APP_BASE_PATH) {
          return VPS_APP_BASE_PATH + '/';
        }
        
        return newPath;
      },
      onError: (err, req, res, target) => {
        console.error('Error de proxy:', err);
        res.status(500).send('Error del servidor proxy.');
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request from ${req.originalUrl} to ${proxyReq.path}`);
      },
      logLevel: 'debug',
    })
  );

// Define el puerto para la aplicación de Render
const PORT = process.env.PORT || 3000; // Render asignará un puerto a través de process.env.PORT

app.listen(PORT, () => {
  console.log(`Proxy de Render escuchando en el puerto ${PORT}`);
  console.log(`Tu aplicación del VPS será accesible a través de la URL de Render (ej. https://tu-nombre.onrender.com/)`);
});