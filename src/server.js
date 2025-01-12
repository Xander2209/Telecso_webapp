const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

let lastSensorData = {
  temperatura: "0",
  humedad: "0",
  energia: "Desconectado",
  puerta: "Cerrado"
};

// Endpoint para recibir datos del ESP32
app.post('/api/sensors', (req, res) => {
  lastSensorData = req.body;
  res.status(200).send('OK');
});

// Endpoint para que React obtenga los datos
app.get('/api/sensors', (req, res) => {
  res.json(lastSensorData);
});

app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});