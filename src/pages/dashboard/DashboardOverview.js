import React, { useState, useEffect } from "react";
import { faThermometerHalf, faTint, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { Col, Row, Card, Dropdown } from '@themesberg/react-bootstrap';
import { CounterWidget } from "../../components/Widgets";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export default () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [currentData, setCurrentData] = useState({});
  const [historicData, setHistoricData] = useState({});

  // Obtener lista de dispositivos
  const fetchDevices = async () => {
    try {
      const response = await fetch('http://sense.telecso.co:3001/api/devices');
      const data = await response.json();
      // Ordenar dispositivos alfabéticamente por nombre
      data.sort((a, b) => a.deviceName.localeCompare(b.deviceName));
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0]._id);
      }
    } catch (error) {
      console.error("Error al obtener dispositivos:", error);
    }
  };

  // Obtener datos de todos los dispositivos
  const fetchAllDeviceData = async () => {
    try {
      const promises = devices.map(device => 
        fetch(`http://sense.telecso.co:3001/api/sensors/${device._id}/latest`)
          .then(response => response.json())
          .then(data => {
            setCurrentData(prevData => ({ ...prevData, [device._id]: data }));
          })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Error al obtener datos de dispositivos:", error);
    }
  };

  // Obtener histórico de todos los dispositivos
  const fetchAllHistoricData = async () => {
    try {
      const promises = devices.map(device => 
        fetch(`http://sense.telecso.co:3001/api/sensors/${device._id}/history`)
          .then(response => response.json())
          .then(data => {
            setHistoricData(prevData => ({ ...prevData, [device._id]: data }));
          })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Error al obtener datos históricos de dispositivos:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      fetchAllDeviceData();
      fetchAllHistoricData();
      const interval = setInterval(() => {
        fetchAllDeviceData();
        fetchAllHistoricData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [devices]);

  // Configuración de las gráficas
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const temperatureData = {
    labels: historicData[selectedDevice]?.map(data => formatDateTime(data.timestamp)) || [],
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: historicData[selectedDevice]?.map(data => data.temperatura) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4
      }
    ]
  };

  const humidityData = {
    labels: historicData[selectedDevice]?.map(data => formatDateTime(data.timestamp)) || [],
    datasets: [
      {
        label: 'Humedad (%)',
        data: historicData[selectedDevice]?.map(data => data.humedad) || [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.4
      }
    ]
  };

  return (
    <>
      <Row className="mb-4">
        <Col xs={12}>
          <Card>
            <Card.Body>
              <Dropdown>
                <Dropdown.Toggle variant="primary">
                  {selectedDevice ? 
                    devices.find(d => d._id === selectedDevice)?.deviceName || 'Seleccionar dispositivo' 
                    : 'Seleccionar dispositivo'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {devices.map(device => (
                    <Dropdown.Item 
                      key={device._id} 
                      onClick={() => setSelectedDevice(device._id)}
                    >
                      {device.deviceName} ({device.location})
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {selectedDevice && (
        <>
          <Row className="justify-content-md-center">
            <Col xs={12} sm={6} xl={4} className="mb-4">
              <CounterWidget
                category="Temperatura"
                title={`${currentData[selectedDevice]?.temperatura?.toFixed(1) || 'N/A'} °C`}
                period={new Date(currentData[selectedDevice]?.timestamp).toLocaleString() || 'N/A'}
                icon={faThermometerHalf}
                iconColor="shape-secondary"
              />
            </Col>
            <Col xs={12} sm={6} xl={4} className="mb-4">
              <CounterWidget
                category="Humedad"
                title={`${currentData[selectedDevice]?.humedad?.toFixed(1) || 'N/A'}%`}
                period={new Date(currentData[selectedDevice]?.timestamp).toLocaleString() || 'N/A'}
                icon={faTint}
                iconColor="shape-tertiary"
              />
            </Col>
            <Col xs={12} sm={6} xl={4} className="mb-4">
              <CounterWidget
                category="Estado Puerta"
                title={currentData[selectedDevice]?.puerta === 1 ? "Abierta" : "Cerrada"}
                period={new Date(currentData[selectedDevice]?.timestamp).toLocaleString() || 'N/A'}
                icon={faDoorOpen}
                iconColor={currentData[selectedDevice]?.puerta === 1 ? "shape-danger" : "shape-success"}
              />
            </Col>
          </Row>

          <Row>
            <Col xs={12} xl={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Histórico de Temperatura</h5>
                </Card.Header>
                <Card.Body>
                  <Line options={chartOptions} data={temperatureData} />
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} xl={6} className="mb-4">
              <Card>
                <Card.Header>
                  <h5>Histórico de Humedad</h5>
                </Card.Header>
                <Card.Body>
                  <Line options={chartOptions} data={humidityData} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              <Card>
                <Card.Header>
                  <h5>Últimas Mediciones</h5>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Fecha y Hora</th>
                          <th>Temperatura</th>
                          <th>Humedad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicData[selectedDevice]?.map((data, index) => (
                          <tr key={index}>
                            <td>{new Date(data.timestamp).toLocaleString()}</td>
                            <td>{data.temperatura}°C</td>
                            <td>{data.humedad}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Header>
              <h5>Todos los Dispositivos</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Dispositivo</th>
                      <th>Ubicación</th>
                      <th>Temperatura</th>
                      <th>Humedad</th>
                      <th>Puerta</th>
                      <th>Última Actualización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map(device => (
                      <tr 
                        key={device._id} 
                        className={selectedDevice === device._id ? 'table-active' : ''}
                        style={{cursor: 'pointer'}}
                        onClick={() => setSelectedDevice(device._id)}
                      >
                        <td>{device.deviceName}</td>
                        <td>{device.location}</td>
                        <td>{currentData[device._id]?.temperatura?.toFixed(1) || 'N/A'}°C</td>
                        <td>{currentData[device._id]?.humedad?.toFixed(1) || 'N/A'}%</td>
                        <td>
                          {currentData[device._id]?.puerta === 1 ? 'Abierta' : 'Cerrada'}
                        </td>
                        <td>{new Date(device.lastUpdate).toLocaleString() || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};