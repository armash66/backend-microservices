const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const services = {
    '/auth': 'http://localhost:3001',
    '/tasks': 'http://localhost:3002'
};

for (const [route, target] of Object.entries(services)) {
    // If we use the exact v3 syntax to filter but NOT strip:
    app.use(createProxyMiddleware({
        target,
        changeOrigin: true,
        pathFilter: route,
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying: ${req.originalUrl} to ${proxyReq.path}`);
        }
    }));
}

app.listen(4000, () => {
    console.log("Test gateway on 4000");
    const http = require('http');
    http.get('http://localhost:4000/auth/register', (res) => {
        console.log("Response:", res.statusCode);
        process.exit(0);
    });
});
