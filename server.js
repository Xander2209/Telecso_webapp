const express = require('express');
const path = require('path');

const app = express();

// Sirve archivos estáticos de la carpeta "build"
app.use(express.static(path.join(__dirname, 'build')));

// Redirige todas las rutas al index.html para aplicaciones SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
