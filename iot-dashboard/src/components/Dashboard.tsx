import React, { useState, useEffect } from 'react';
import { MOCK_SENSORS, SensorData, updateSensorsData } from '../data/sensors';
import SensorCard from './SensorCard';
import ComparisonChart from './ComparisonChart';
import CameraView from './CameraView'; // Importamos el nuevo componente
import './Dashboard.css';

interface DashboardProps {
  darkModeEnabled?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ darkModeEnabled = false }) => {  const [sensors, setSensors] = useState<SensorData[]>(MOCK_SENSORS);
  const [filterType, setFilterType] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState<number>(5); // En segundos
  const [darkMode, setDarkMode] = useState<boolean>(darkModeEnabled);
  
  // Actualizar el estado local cuando cambie la prop
  useEffect(() => {
    setDarkMode(darkModeEnabled);
  }, [darkModeEnabled]);

  // Efecto para actualizar los datos periódicamente
  useEffect(() => {
    const intervalId = setInterval(() => {
      const updatedSensors = updateSensorsData();
      setSensors(updatedSensors);
    }, refreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  // Obtener tipos de sensores únicos para el filtro
  const uniqueTypes = Array.from(
    new Set(sensors.map((sensor) => sensor.type))
  );

  // Filtrar sensores solo según el tipo
  const filteredSensors = sensors.filter((sensor) => {
    return filterType === 'all' || sensor.type === filterType;
  });
  // Ya no necesitamos esta función, ya que el estado dark mode se maneja desde App.jsx

  return (
    <div className="dashboard-container">      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard del Auto Explorador</h1>
          <p>Monitoreo de Sensores en Tiempo Real</p>
        </div>
        <div className="dashboard-controls">
          {/* El botón de tema oscuro ahora está en la barra de navegación */}
        </div>
      </header><div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="type-filter">Tipo de Sensor:</label>
          <select
            id="type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los tipos</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'rain' && 'Sensor de Lluvia'}
                {type === 'gas' && 'Sensor de Gas'}
                {type === 'microphone' && 'Micrófono'}
                {type === 'camera' && 'Cámara'}
                {type === 'ultrasonic' && 'Sensor Ultrasónico'}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="refresh-interval">Actualización:</label>
          <select
            id="refresh-interval"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="filter-select"
          >
            <option value="1">1 segundo</option>
            <option value="5">5 segundos</option>
            <option value="10">10 segundos</option>
            <option value="30">30 segundos</option>
            <option value="60">1 minuto</option>
          </select>
        </div>
      </div>      <div className="dashboard-summary">
        <div className="summary-item">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <span className="summary-label">Total de Sensores</span>
            <span className="summary-value">{filteredSensors.length}</span>
          </div>
          <div className="summary-progress">
            <div className="progress-bar" style={{ width: `${(filteredSensors.length / MOCK_SENSORS.length) * 100}%` }}></div>
          </div>
        </div>
        
        <div className="summary-item critical-card">
          <div className="summary-icon">⚠️</div>
          <div className="summary-content">
            <span className="summary-label">Sensores Críticos</span>
            <span className="summary-value critical">
              {filteredSensors.filter((s) => s.status === 'critical').length}
            </span>
          </div>
          <div className="summary-progress">
            <div className="progress-bar critical-bar" 
                style={{ width: `${(filteredSensors.filter((s) => s.status === 'critical').length / filteredSensors.length) * 100}%` }}>
            </div>
          </div>
        </div>
        
        <div className="summary-item warning-card">
          <div className="summary-icon">⚡</div>
          <div className="summary-content">
            <span className="summary-label">Advertencias</span>
            <span className="summary-value warning">
              {filteredSensors.filter((s) => s.status === 'warning').length}
            </span>
          </div>
          <div className="summary-progress">
            <div className="progress-bar warning-bar" 
                style={{ width: `${(filteredSensors.filter((s) => s.status === 'warning').length / filteredSensors.length) * 100}%` }}>
            </div>
          </div>
        </div>
        
        <div className="summary-item normal-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <span className="summary-label">Normales</span>
            <span className="summary-value normal">
              {filteredSensors.filter((s) => s.status === 'normal').length}
            </span>
          </div>
          <div className="summary-progress">
            <div className="progress-bar normal-bar" 
                style={{ width: `${(filteredSensors.filter((s) => s.status === 'normal').length / filteredSensors.length) * 100}%` }}>
            </div>
          </div>
        </div>
      </div>
        {/* Sección de cámaras del auto explorador */}      <div className="camera-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">📹</span>
            Visión en Tiempo Real
          </h2>
        </div>
        
        <div className="camera-container">
          <CameraView title="Cámara Frontal" location="Frontal" />
          <div className="camera-stats">
            <div className="stat-item">
              <span className="stat-label">Resolución</span>
              <span className="stat-value">1280x720</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">FPS</span>
              <span className="stat-value">30</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Latencia</span>
              <span className="stat-value">120ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sensors-grid">
        {filteredSensors.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
        {filteredSensors.length === 0 && (
          <div className="no-sensors-message">
            <p>No se encontraron sensores con los filtros seleccionados.</p>
          </div>
        )}
      </div>
      
      <ComparisonChart sensors={sensors} />      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-section main-section">
            <div className="footer-logo">
              <span className="footer-logo-icon">🚗</span>
              <h3>Auto Explorador</h3>
            </div>
            <p>Sistema de monitoreo en tiempo real diseñado para maximizar el rendimiento y seguridad de vehículos exploradores autónomos en entornos diversos.</p>
            <div className="social-links">
              <a href="#" className="social-link">📱</a>
              <a href="#" className="social-link">📧</a>
              <a href="#" className="social-link">🌐</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Equipo</h3>
            <ul className="dev-team">
              <li><span className="team-role">Líder:</span> Juan Pérez</li>
              <li><span className="team-role">Front-end:</span> María García</li>
              <li><span className="team-role">IoT:</span> Carlos Rodríguez</li>
              <li><span className="team-role">Datos:</span> Ana Martínez</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Tecnologías</h3>
            <div className="tech-stack">
              <span className="tech-tag">React</span>
              <span className="tech-tag">TypeScript</span>
              <span className="tech-tag">ESP32</span>
              <span className="tech-tag">MQTT</span>
              <span className="tech-tag">Vite</span>
              <span className="tech-tag">ChartJS</span>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Enlaces Rápidos</h3>
            <ul className="quick-links">
              <li><a href="#">Documentación</a></li>
              <li><a href="#">API</a></li>
              <li><a href="#">Soporte</a></li>
              <li><a href="#">Reportar Problema</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">
            <p>© 2025 Auto Explorador - Todos los derechos reservados</p>
          </div>
          <div className="footer-meta">
            <p className="version">Versión 1.2.0</p>
            <p className="update-time">Última actualización: 19/06/2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;