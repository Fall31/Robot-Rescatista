import React, { useState } from 'react';
import { SensorData } from '../data/sensors';
import './SensorCard.css';
import { Line } from 'react-chartjs-2';
import SensorDetail from './SensorDetail';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar los componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Definir la interfaz de propiedades
interface SensorCardProps {
  sensor: SensorData;
}

// Definición del componente
const SensorCard = (props: SensorCardProps) => {
  const { sensor } = props;
  const [showDetail, setShowDetail] = useState(false);  // Determinar si estamos en modo oscuro - revisando el elemento raíz o el body
  const isDarkMode = document.documentElement.classList.contains('dark-mode') || 
                    document.body.classList.contains('dark-mode') ||
                    document.querySelector('.app-container')?.classList.contains('dark-mode');
  
  // Formatear los datos para el gráfico
  const chartData = {
    labels: sensor?.history?.map(item => {
      const time = new Date(item.timestamp);
      return `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;
    }) || [],
    datasets: [{
        label: sensor?.name || '',
        data: sensor?.history?.map(item => item.value) || [],
        fill: true,
        backgroundColor: isDarkMode ? 'rgba(97, 218, 251, 0.2)' : 'rgba(52, 152, 219, 0.2)', 
        borderColor: isDarkMode ? 'rgba(97, 218, 251, 0.8)' : 'rgba(52, 152, 219, 0.8)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: isDarkMode ? '#61dafb' : '#3498db',
        pointBorderColor: isDarkMode ? '#1e1e32' : '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        tension: 0.3,
        pointHitRadius: 10,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: '#2980b9',
      },
    ],
  };

  // Opciones para el gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',        titleFont: {
          size: 14,
          weight: "bold" as const
        },
        bodyFont: {
          size: 13
        },
        padding: 10,
        callbacks: {
          label: function(context: any) {
            return `Valor: ${context.parsed.y} ${sensor?.unit || ''}`;
          }
        }
      }
    },    scales: {
      y: {
        min: Math.max(0, (sensor?.min || 0) - ((sensor?.max || 1) - (sensor?.min || 0)) * 0.1),
        max: (sensor?.max || 1) * 1.1,
        ticks: {
          callback: function(value: any) {
            return `${value} ${sensor?.unit || ''}`;
          },
          color: isDarkMode ? '#ffffff' : '#2c3e50',
          font: {
            size: 12,
            weight: 'bold' as const
          },
          maxRotation: 0
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
          drawBorder: true
        }
      },
      x: {
        ticks: {
          color: isDarkMode ? '#ffffff' : '#2c3e50',
          font: {
            size: 12,
            weight: 'bold' as const
          },
          maxRotation: 0
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
          drawBorder: true
        }
      }
    }
  };

  // Obtener la clase CSS según el tipo y estado del sensor
  const getCardClasses = () => {
    if (!sensor) return '';
    
    let classes = sensor.type || ''; // Añadir el tipo como clase
    
    // Añadir también la clase de estado si es necesario
    switch (sensor.status) {
      case 'normal':
        classes += ' status-normal';
        break;
      case 'warning':
        classes += ' status-warning';
        break;
      case 'critical':
        classes += ' status-critical';
        break;
    }
    
    return classes;
  };
  // Obtener un emoji según el tipo de sensor
  const getSensorEmoji = () => {
    if (!sensor || !sensor.type) return '📊';
    
    switch (sensor.type) {
      case 'rain':
        return '🌧️';
      case 'gas':
        return '💨';
      case 'microphone':
        return '🎤';
      case 'camera':
        return '📹';
      case 'ultrasonic':
        return '📡';
      default:
        return '📊';
    }
  };

  // Formatear la fecha
  const formatDate = (date: Date) => {
    if (!date) return '';
    
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Si no hay sensor, no renderizar nada
  if (!sensor) {
    return null;
  }
  return (
    <>
      <div 
        className={`sensor-card ${getCardClasses()}`}
        onClick={() => setShowDetail(true)}
      >
        <div className="sensor-status-indicator"></div>
          <div className="sensor-header">
          <div className="sensor-icon">{getSensorEmoji()}</div>
          <div className="sensor-title-container">
            <h3 className="sensor-title">{sensor?.name || ''}</h3>
            <div className="sensor-location">
              <span className="location-icon">📍</span> {sensor?.location || ''}
            </div>
          </div>
          <div className={`sensor-status-badge status-${sensor.status}`}>
            {sensor.status === 'normal' && 'Normal'}
            {sensor.status === 'warning' && 'Advertencia'}
            {sensor.status === 'critical' && 'Crítico'}
            <span className="badge-pulse"></span>
          </div>
        </div>
        
        <div className="sensor-value-container">
          <div className="sensor-value">
            <span className="value">{sensor?.value !== undefined ? sensor.value : ''}</span>
            <span className="unit">{sensor?.unit || ''}</span>
          </div>
          <div className="sensor-trend">
            {sensor.history && sensor.history.length > 2 && 
              (sensor.history[sensor.history.length-1].value > sensor.history[sensor.history.length-2].value ? 
                <span className="trend-up">↗️</span> : 
                <span className="trend-down">↘️</span>)
            }
          </div>
        </div>
        
        <div className="sensor-chart">
          <Line data={chartData} options={chartOptions} />
        </div>
        
        <div className="sensor-footer">
          <div className="sensor-range">
            <div className="range-item">
              <span className="range-label">Min</span>
              <span className="range-value">{sensor?.min}{sensor?.unit}</span>
            </div>
            <div className="range-item">
              <span className="range-label">Max</span>
              <span className="range-value">{sensor?.max}{sensor?.unit}</span>
            </div>
          </div>
          <div className="sensor-timestamp">
            <span className="time-icon">🕓</span> {formatDate(sensor.timestamp)}
          </div>
        </div>
          <div className="sensor-action">
          <button className="detail-btn">
            <span className="btn-text">Ver detalles</span>
            <span className="btn-icon">👁️</span>
          </button>
        </div>
      </div>
      
      {showDetail && <SensorDetail sensor={sensor} onClose={() => setShowDetail(false)} />}
    </>
  );
};

export default SensorCard;