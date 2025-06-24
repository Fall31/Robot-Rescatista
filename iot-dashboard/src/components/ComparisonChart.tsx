import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { SensorData, getSensorStatusColor } from '../data/sensors';
import './ComparisonChart.css';

interface ComparisonChartProps {
  sensors: SensorData[];
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ sensors }) => {
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('24'); // Horas
  
  // Manejar la selección/deselección de sensores
  const handleSensorToggle = (sensorId: string) => {
    if (selectedSensors.includes(sensorId)) {
      setSelectedSensors(selectedSensors.filter(id => id !== sensorId));
    } else {
      setSelectedSensors([...selectedSensors, sensorId]);
    }
  };
  
  // Filtrar sensores seleccionados
  const filteredSensors = sensors.filter(sensor => selectedSensors.includes(sensor.id));
  
  // Preparar datos para el gráfico
  const chartData = {
    labels: filteredSensors.length > 0 
      ? filteredSensors[0].history.map(item => {
          const time = new Date(item.timestamp);
          return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
        })
      : [],
    datasets: filteredSensors.map(sensor => ({
      label: `${sensor.name} (${sensor.unit})`,
      data: sensor.history.map(item => item.value),
      fill: false,
      borderColor: getSensorStatusColor(sensor.status),
      backgroundColor: getSensorStatusColor(sensor.status),
      tension: 0.4,
    }))
  };
  
  // Opciones para el gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Valor',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
      x: {
        title: {
          display: true,
          text: 'Tiempo',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      },
    },
  };
  
  // Agrupar sensores por tipo
  const sensorsByType = sensors.reduce((acc, sensor) => {
    const type = sensor.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(sensor);
    return acc;
  }, {} as Record<string, SensorData[]>);
    // Obtener el tipo de sensor en español
  const getSensorTypeName = (type: string): string => {
    switch(type) {
      // Sensores del auto explorador
      case 'rain': return 'Lluvia';
      case 'gas': return 'Gas';
      case 'microphone': return 'Micrófono';
      case 'camera': return 'Cámara';
      case 'ultrasonic': return 'Ultrasónico';
      // Mantener compatibilidad con otros posibles tipos
      case 'temperature': return 'Temperatura';
      case 'humidity': return 'Humedad';
      case 'pressure': return 'Presión';
      case 'air_quality': return 'Calidad del Aire';
      case 'light': return 'Luminosidad';
      case 'motion': return 'Movimiento';
      case 'sound': return 'Sonido';
      default: return type;
    }
  };

  return (
    <div className="comparison-chart">
      <div className="comparison-header">
        <h2>Comparación de Sensores</h2>
        <div className="time-range">
          <label htmlFor="time-range">Rango de tiempo:</label>
          <select 
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="6">Últimas 6 horas</option>
            <option value="12">Últimas 12 horas</option>
            <option value="24">Últimas 24 horas</option>
            <option value="48">Últimos 2 días</option>
            <option value="168">Última semana</option>
          </select>
        </div>
      </div>
      
      <div className="sensor-selection">
        <h3>Seleccionar Sensores para Comparar</h3>
        {Object.keys(sensorsByType).map(type => (
          <div key={type} className="sensor-type-group">
            <h4>{getSensorTypeName(type)}</h4>
            <div className="sensor-checkboxes">
              {sensorsByType[type].map(sensor => (
                <label key={sensor.id} className="sensor-checkbox">
                  <input 
                    type="checkbox"
                    checked={selectedSensors.includes(sensor.id)}
                    onChange={() => handleSensorToggle(sensor.id)}
                  />
                  <span style={{color: getSensorStatusColor(sensor.status)}}>
                    {sensor.name} ({sensor.location})
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
        <div className="chart-container">
        {filteredSensors.length > 0 ? (
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="no-sensors-selected">
            <div className="empty-chart-content">
              <div className="chart-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L7 5M7 5L11 9M7 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 15L17 19M17 19L21 15M17 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Sin datos para comparar</h3>
              <p>Selecciona al menos un sensor para visualizar el gráfico comparativo.</p>
              <div className="sensor-suggestions">
                <h4>Sugerencias para comparar:</h4>
                <ul>
                  {Object.keys(sensorsByType).length > 0 && (
                    <>
                      {Object.keys(sensorsByType).map((type, index) => (
                        <li key={type} onClick={() => {
                          // Seleccionar automáticamente el primer sensor de este tipo si hay sensores disponibles
                          if (sensorsByType[type].length > 0) {
                            handleSensorToggle(sensorsByType[type][0].id);
                          }
                        }}>
                          <button className="suggestion-button">
                            {getSensorTypeName(type)}
                          </button>
                        </li>
                      )).slice(0, 3)}
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonChart;
