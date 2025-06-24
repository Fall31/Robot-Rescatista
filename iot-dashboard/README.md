# IoT Dashboard - Visualización de Datos de Sensores

## Descripción

IoT Dashboard es una interfaz web moderna y elegante para la visualización de datos recopilados por sensores IoT. Proporciona una visualización en tiempo real de los valores de sensores, representaciones gráficas y herramientas analíticas para monitorear el estado de los dispositivos conectados.

## Características Principales

- **Dashboard Interactivo**: Visualización clara y atractiva de datos de sensores en tiempo real
- **Gráficos Dinámicos**: Representaciones gráficas de datos históricos para cada sensor
- **Vista Comparativa**: Herramienta para comparar datos de múltiples sensores en un solo gráfico
- **Detalles Avanzados**: Vista detallada por sensor con estadísticas y análisis
- **Filtros y Búsqueda**: Organización de sensores por ubicación y tipo
- **Diseño Responsivo**: Experiencia optimizada para todo tipo de dispositivos
- **Modo Oscuro**: Interfaz adaptable para diferentes condiciones de iluminación

## Tecnologías Utilizadas

- **React**: Biblioteca frontend para construir interfaces de usuario
- **TypeScript**: Lenguaje tipado que mejora la robustez del código
- **Chart.js**: Biblioteca para crear gráficos interactivos
- **React Router**: Enrutamiento en la aplicación
- **CSS3**: Estilos modernos con animaciones y efectos visuales
- **Vite**: Herramienta de construcción rápida para aplicaciones web modernas

## Estructura del Proyecto

```
iot-dashboard/
|-- public/            # Archivos estáticos
|-- src/
|   |-- assets/        # Imágenes y recursos
|   |-- components/    # Componentes React
|   |   |-- Dashboard.tsx         # Componente principal del dashboard
|   |   |-- SensorCard.tsx        # Tarjeta individual de sensor
|   |   |-- SensorDetail.tsx      # Vista detallada de un sensor
|   |   |-- ComparisonChart.tsx   # Comparativa de sensores
|   |   |-- Home.tsx              # Página de inicio
|   |   |-- Navbar.tsx            # Barra de navegación
|   |-- data/
|   |   |-- sensors.ts            # Datos simulados y utilidades
|   |-- App.jsx        # Componente raíz
|   |-- main.jsx       # Punto de entrada
|-- package.json       # Dependencias y scripts
```

## Uso

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/iot-dashboard.git

# Navegar al directorio del proyecto
cd iot-dashboard

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

### Producción

```bash
# Construir para producción
npm run build

# Previsualizar la versión de producción
npm run preview
```

## Personalización

La aplicación puede personalizarse fácilmente:

- **Paleta de Colores**: Modificar variables CSS en `src/index.css`
- **Datos de Sensores**: Ajustar los modelos y datos simulados en `src/data/sensors.ts`
- **Tipos de Sensores**: Añadir nuevos tipos de sensores ampliando las interfaces y funciones en `src/data/sensors.ts`

## Adaptación a Datos Reales

Para conectar con datos reales de sensores:

1. Crear un servicio API en `src/services/api.ts`
2. Implementar funciones para obtener datos de tu backend
3. Reemplazar las llamadas a `updateSensorsData()` con las llamadas a tu API

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo `LICENSE` para más detalles.

## Contacto

Para consultas o colaboraciones, por favor contactar a través de [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com).

---

Desarrollado con ❤️ para facilitar la visualización y monitoreo de datos IoT.
