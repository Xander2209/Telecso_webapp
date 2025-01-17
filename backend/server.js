const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión MongoDB
mongoose.connect('mongodb://localhost:27017/sensorDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Modelo de datos
const SensorData = mongoose.model('SensorData', {
  temperatura: Number,
  humedad: Number,
  puerta: Number,      // 0 = cerrada, 1 = abierta
  id: String,
  deviceName: String,
  location: String,
  timestamp: { type: Date, default: Date.now }
});

// Ruta para recibir datos de los ESP32
app.post('/api/sensors', async (req, res) => {
  try {
    const sensorData = new SensorData(req.body);
    await sensorData.save();
    res.status(201).json({ message: 'Datos guardados correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/', async (req, res) => {
  try {
    res.status(404).json({message: 'Esta pagina no esta disponible.'})
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

})

// Obtener lista de dispositivos únicos
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await SensorData.aggregate([
      { $group: {
        _id: "$id",
        deviceName: { $first: "$deviceName" },
        location: { $first: "$location" },
        lastUpdate: { $max: "$timestamp" }
      }}
    ]);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener últimos datos de un dispositivo específico
app.get('/api/sensors/:deviceId/latest', async (req, res) => {
  try {
    const data = await SensorData.findOne({ id: req.params.deviceId })
      .sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener histórico de un dispositivo específico
app.get('/api/sensors/:deviceId/history', async (req, res) => {
  try {
    const data = await SensorData.find({ id: req.params.deviceId })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Servidor corriendo en puerto 3001');
});