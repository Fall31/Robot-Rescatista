// Tipos de datos para nuestros sensores del auto explorador
export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  status: 'normal' | 'warning' | 'critical';
  timestamp: Date;
  location: string;
  type: 'rain' | 'gas' | 'microphone' | 'camera' | 'ultrasonic';
  history: {
    timestamp: Date;
    value: number;
  }[];
}

// Función para generar datos históricos aleatorios
const generateHistoricalData = (min: number, max: number, count: number = 24) => {
  const now = new Date();
  const data: Array<{timestamp: Date; value: number}> = [];
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() - i);
    
    data.push({
      timestamp: new Date(timestamp),
      value: Math.round((Math.random() * (max - min) + min) * 10) / 10
    });
  }
  
  return data;
};

// Función para determinar el estado del sensor basado en su valor actual
const determineSensorStatus = (value: number, min: number, max: number): 'normal' | 'warning' | 'critical' => {
  const range = max - min;
  const warningThreshold = min + (range * 0.7);
  const criticalThreshold = min + (range * 0.9);
  
  if (value >= criticalThreshold) {
    return 'critical';
  } else if (value >= warningThreshold) {
    return 'warning';
  } else {
    return 'normal';
  }
};

// Datos simulados de sensores para auto explorador
export const MOCK_SENSORS: SensorData[] = [
  {
    id: 's001',
    name: 'Sensor de Lluvia',
    value: 0,  // 0 = sin lluvia, aumenta según la intensidad
    unit: 'mm/h',
    min: 0,
    max: 50,
    status: 'normal',
    timestamp: new Date(),
    location: 'Exterior',
    type: 'rain',
    history: generateHistoricalData(0, 5)
  },
  {
    id: 's002',
    name: 'Sensor de Gas',
    value: 15,  // PPM (partes por millón)
    unit: 'PPM',
    min: 0,
    max: 1000,
    status: 'normal',
    timestamp: new Date(),
    location: 'Frontal',
    type: 'gas',
    history: generateHistoricalData(10, 30)
  },
  {
    id: 's003',
    name: 'Micrófono Ambiental',
    value: 45,  // Decibelios
    unit: 'dB',
    min: 0,
    max: 120,
    status: 'normal',
    timestamp: new Date(),
    location: 'Exterior',
    type: 'microphone',
    history: generateHistoricalData(35, 60)
  },
  {    id: 's004',
    name: 'Cámara Principal',
    value: 100,  // Porcentaje de visibilidad/calidad
    unit: '%',
    min: 0,
    max: 100,
    status: 'normal',    timestamp: new Date(),
    location: 'Frontal',
    type: 'camera',
    history: generateHistoricalData(80, 100)
  },
  {
    id: 's005',
    name: 'Sensor Ultrasónico',
    value: 150,  // Distancia en centímetros
    unit: 'cm',
    min: 0,
    max: 400,
    status: 'normal',
    timestamp: new Date(),
    location: 'Frontal',
    type: 'ultrasonic',
    history: generateHistoricalData(50, 300)
  }
];

// Función para actualizar los datos de los sensores con nuevos valores aleatorios
export const updateSensorsData = (): SensorData[] => {
  return MOCK_SENSORS.map(sensor => {
    // Generar un nuevo valor dentro de los rangos del sensor
    const newValue = Math.round((Math.random() * (sensor.max - sensor.min) + sensor.min) * 10) / 10;
    
    // Actualizar el historial agregando el nuevo valor
    const newHistory = [...sensor.history.slice(1), { timestamp: new Date(), value: newValue }];
    
    // Actualizar el estado basado en el nuevo valor
    const status = determineSensorStatus(newValue, sensor.min, sensor.max);
    
    return {
      ...sensor,
      value: newValue,
      status,
      timestamp: new Date(),
      history: newHistory
    };
  });
};

// Función para obtener un color basado en el estado del sensor
export const getSensorStatusColor = (status: 'normal' | 'warning' | 'critical') => {
  switch (status) {
    case 'normal':
      return '#2ecc71'; // Verde
    case 'warning':
      return '#f39c12'; // Naranja
    case 'critical':
      return '#e74c3c'; // Rojo
    default:
      return '#3498db'; // Azul por defecto
  }
};

// Función para obtener un icono basado en el tipo de sensor
export const getSensorTypeIcon = (type: string) => {
  switch (type) {
    // Sensores del auto explorador
    case 'rain':
      return 'water_drop';
    case 'gas':
      return 'cloud';
    case 'microphone':
      return 'mic';
    case 'camera':
      return 'videocam';
    case 'ultrasonic':
      return 'radar';
    // Mantener compatibilidad con otros posibles tipos
    case 'temperature':
      return 'thermometer';
    case 'humidity':
      return 'water';
    case 'pressure':
      return 'gauge';
    case 'air_quality':
      return 'air';
    case 'light':
      return 'lightbulb';
    case 'motion':
      return 'directions_run';
    case 'sound':
      return 'volume_up';
    default:
      return 'sensors';
  }
};