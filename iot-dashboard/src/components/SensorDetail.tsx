import React from 'react';
import { Line } from 'react-chartjs-2';
import { SensorData, getSensorStatusColor } from '../data/sensors';
import './SensorDetail.css';

interface SensorDetailProps {
  sensor: SensorData;
  onClose: () => void;
}

const SensorDetail: React.FC<SensorDetailProps> = ({ sensor, onClose }) => {
  // Formatear los datos para el gráfico principal
  const chartData = {    labels: sensor?.history?.map(item => {
      const time = new Date(item.timestamp);
      return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
    }) || [],
    datasets: [
      {
        label: `${sensor?.name || ''} (${sensor?.unit || ''})`,
        data: sensor?.history?.map(item => item.value) || [],
        fill: true,
        backgroundColor: `${getSensorStatusColor(sensor.status)}20`,
        borderColor: getSensorStatusColor(sensor.status),
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Opciones avanzadas para el gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} ${sensor.unit}`;
          }
        }
      },
    },
    scales: {
      y: {
        min: Math.max(0, sensor.min - (sensor.max - sensor.min) * 0.1),
        max: sensor.max * 1.1,
        ticks: {
          callback: function(value: any) {
            return `${value} ${sensor.unit}`;
          }
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)"
        }
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)"
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  // Obtener una descripción del estado del sensor
  const getSensorStatusDescription = () => {
    switch (sensor.status) {
      case 'normal':
        return 'El sensor funciona dentro de los parámetros normales.';
      case 'warning':
        return 'El sensor está registrando valores que requieren atención.';
      case 'critical':
        return '¡Alerta! El sensor está registrando valores críticos.';
      default:
        return 'Estado desconocido.';
    }
  };

  // Formatear la fecha y hora
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calcular estadísticas simples
  const calculateStats = () => {
    const values = sensor.history.map(item => item.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    return {
      promedio: avg.toFixed(1),
      maximo: max.toFixed(1),
      minimo: min.toFixed(1),
      actual: sensor.value.toFixed(1)
    };
  };
  
  const stats = calculateStats();

  // Calcular el porcentaje respecto al rango
  const calculatePercentage = () => {
    const range = sensor.max - sensor.min;
    const value = sensor.value - sensor.min;
    return (value / range) * 100;
  };

  return (
    <div className="sensor-detail-overlay">
      <div className="sensor-detail-container">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="sensor-detail-header">
          <div className="detail-title-group">
            <h2>{sensor.name}</h2>
            <span className={`detail-status status-${sensor.status}`}>
              {sensor.status === 'normal' ? 'Normal' : 
               sensor.status === 'warning' ? 'Advertencia' : 'Crítico'}
            </span>
          </div>
          <div className="detail-location">
            <span className="location-icon">📍</span>
            {sensor.location}
          </div>
        </div>
        
        <div className="sensor-detail-body">
          <div className="sensor-current-value">
            <div className="current-value-label">Valor actual</div>
            <div className="current-value">
              <span className="value-number">{sensor.value.toFixed(1)}</span>
              <span className="value-unit">{sensor.unit}</span>
            </div>
            <div className="value-range-bar">
              <div className="range-min">{sensor.min}</div>
              <div className="range-bar">
                <div 
                  className="range-indicator" 
                  style={{
                    left: `${calculatePercentage()}%`,
                    backgroundColor: getSensorStatusColor(sensor.status)
                  }}
                ></div>
              </div>
              <div className="range-max">{sensor.max}</div>
            </div>
          </div>
          
          <div className="sensor-chart-container">
            <h3>Historial de las últimas 24 horas</h3>
            <div className="chart-wrapper">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          
          <div className="sensor-stats">
            <h3>Estadísticas</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{stats.actual}</div>
                <div className="stat-label">Actual</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.promedio}</div>
                <div className="stat-label">Promedio</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.maximo}</div>
                <div className="stat-label">Máximo</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.minimo}</div>
                <div className="stat-label">Mínimo</div>
              </div>
            </div>
          </div>
          
          <div className="sensor-info">
            <h3>Información del sensor</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">ID del Sensor</div>
                <div className="info-value">{sensor.id}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Tipo</div>
                <div className="info-value">{sensor.type === 'temperature' ? 'Temperatura' : 
                                             sensor.type === 'humidity' ? 'Humedad' : 
                                             sensor.type === 'pressure' ? 'Presión' : 
                                             sensor.type === 'air_quality' ? 'Calidad del Aire' :
                                             sensor.type === 'light' ? 'Luminosidad' :
                                             sensor.type === 'motion' ? 'Movimiento' : 
                                             sensor.type === 'sound' ? 'Sonido' : sensor.type}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Estado</div>
                <div className="info-value">{getSensorStatusDescription()}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Última Actualización</div>
                <div className="info-value">{formatDateTime(sensor.timestamp)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sensor-detail-footer">
          <button className="action-button">Exportar Datos</button>
          <button className="action-button">Configurar Alertas</button>
        </div>
      </div>
    </div>
  );
};

export default SensorDetail;
