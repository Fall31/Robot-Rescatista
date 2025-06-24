import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="home-overlay"></div>
      <div className="home-content">
        <h1 className="home-title">Sistema de Monitoreo IoT</h1>
        <p className="home-subtitle">Visualización de datos en tiempo real de sensores conectados</p>
        
        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Monitoreo en Tiempo Real</h3>
            <p>Visualiza los datos de tus sensores con actualizaciones constantes</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Alertas Inteligentes</h3>
            <p>Recibe notificaciones cuando los sensores detecten valores anormales</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Diseño Responsivo</h3>
            <p>Accede desde cualquier dispositivo con una experiencia optimizada</p>
          </div>
        </div>
        
        <div className="home-cta">
          <Link to="/dashboard" className="cta-button">
            Acceder al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
