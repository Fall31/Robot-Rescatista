import React, { useState, useEffect, useRef } from 'react';
import './CameraView.css';

interface CameraViewProps {
  title?: string;
  location?: string;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  title = "Cámara del Auto Explorador", 
  location = "Frontal" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Función unificada para iniciar transmisión desde diferentes fuentes
  const startStream = async () => {
    try {
      // Por defecto, intentamos acceder a la webcam del dispositivo
      // Si estás usando ESP32-CAM o una cámara IP, descomenta la sección correspondiente
      
      // OPCIÓN 1: Webcam del dispositivo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
      
      // OPCIÓN 2: ESP32-CAM - Descomenta para usar
      // if (videoRef.current) {
      //   videoRef.current.src = "http://dirección-esp32-cam/stream";
      //   videoRef.current.onload = () => {
      //     setIsStreaming(true);
      //     setError(null);
      //   };
      //   videoRef.current.onerror = () => {
      //     setError("No se pudo conectar a la cámara del auto explorador. Verifica la conexión.");
      //     setIsStreaming(false);
      //   };
      // }
      
      // OPCIÓN 3: Cámara IP - Descomenta para usar
      // if (videoRef.current) {
      //   videoRef.current.src = "http://dirección-ip-cámara:puerto/video";
      //   videoRef.current.onload = () => {
      //     setIsStreaming(true);
      //     setError(null);
      //   };
      //   videoRef.current.onerror = () => {
      //     setError("No se pudo conectar a la cámara IP. Verifica la conexión.");
      //     setIsStreaming(false);
      //   };
      // }
      
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    // Limpieza al desmontar
    return () => {
      stopStream();
    };
  }, []);  return (    <div className="sensor-card camera-card" style={{ 
      width: '100%', 
      maxWidth: '100vw', /* Usar todo el ancho de la ventana */
      margin: '0',
      boxSizing: 'border-box',
      padding: '5px'
    }}>
      <div className="sensor-header">
        <div className="sensor-icon">📹</div>
        <h3 className="sensor-title">{title}</h3>
        <div className="sensor-location">{location}</div>
        <div className="camera-status">
          {isStreaming ? (
            <span className="status-badge online">● En vivo</span>
          ) : (
            <span className="status-badge offline">● En espera</span>
          )}
        </div>
      </div>
        <div className="camera-container" style={{ width: '100%', height: '900px' }}>
        {error && <div className="camera-error">{error}</div>}        <div className="video-wrapper">          <video 
            ref={videoRef}
            className="camera-video"
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
          />
        </div>
        
        <div className="camera-controls">
          {!isStreaming ? (
            <button 
              className="camera-button start-button" 
              onClick={startStream}
            >
              Iniciar transmisión
            </button>
          ) : (
            <button 
              className="camera-button stop-button" 
              onClick={stopStream}
            >
              Detener transmisión
            </button>
          )}
        </div>
      </div>      <div className="sensor-footer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px' }}>
        <div className="sensor-timestamp">
          {isStreaming ? 'Transmitiendo en vivo' : 'Transmisión detenida'}
        </div>
      </div>
    </div>
  );
};

export default CameraView;