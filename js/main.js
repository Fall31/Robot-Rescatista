// Constantes y configuración
const CONFIG = {
    updateInterval: 1000, // Intervalo de actualización en milisegundos
    chartMaxPoints: 20, // Número máximo de puntos en las gráficas
    proximityThresholds: {
        danger: 20, // Centímetros para zona de peligro
        warning: 50, // Centímetros para zona de advertencia
    }
};

// Variables globales
let temperatureData = [];
let humidityData = [];
let temperatureChart;
let humidityChart;
let isAudioPlaying = false;
let isMuted = false;
let activeControls = new Set();

// Inicialización al cargar el documento
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando interfaz del Carrito Explorador...');
    
    // Inicializar controles
    initControlButtons();
    initRangeSliders();
    initAudioButtons();
    initMicToggles();
    initHistoryPanel();
    
    // Inicializar gráficas
    initCharts();
    
    // Inicializar controles de la cámara
    initCameraControls();
    
    // Iniciar simulaciones para demostración
    if (window.location.search.includes('demo=true')) {
        startDemoMode();
    }
    
    // Iniciar la actualización periódica de datos
    setInterval(updateSensorData, CONFIG.updateInterval);
    
    // Actualizar estilos de sensores con colores azules
    updateSensorStyles();
    
    // NUEVA FUNCIONALIDAD: Conexión automática a la cámara
    setTimeout(() => {
        autoConnectToCamera();
    }, 1000);
});

// NUEVA FUNCIÓN: Conexión automática a la cámara
function autoConnectToCamera() {
    try {
        // Buscar los elementos necesarios con diferentes selectores para mayor robustez
        const cameraIPInput = document.querySelector('input[placeholder="Ej: 192.168.1.100"]') || 
                             document.getElementById('cameraIP');
        const connectBtn = document.querySelector('button.btn-primary:not([id])') || 
                          document.getElementById('connectCamera') || 
                          document.getElementById('connectBtn');
        
        if (cameraIPInput && connectBtn) {
            // Establecer la IP predeterminada
            cameraIPInput.value = CAMERA_CONFIG.defaultIP;
            
            // Simular clic en el botón de conexión
            connectBtn.click();
            
            console.log('Iniciando conexión automática a la cámara IP:', cameraIPInput.value);
            
            // Forzar visualización del stream si el método normal falla
            setTimeout(() => {
                forceStreamDisplay(CAMERA_CONFIG.defaultIP);
            }, 1500);
        } else {
            console.error('No se encontraron los elementos necesarios para la conexión automática');
            console.log('Elementos encontrados:', { 
                cameraIPInput: cameraIPInput?.id || 'no encontrado', 
                connectBtn: connectBtn?.id || 'no encontrado'
            });
        }
    } catch (error) {
        console.error('Error al intentar la conexión automática:', error);
    }
}

// NUEVA FUNCIÓN: Forzar la visualización del stream
function forceStreamDisplay(ipAddress) {
    try {
        // Obtener elementos del DOM
        const videoPlaceholder = document.getElementById('videoPlaceholder') || 
                               document.querySelector('.text-center.p-4');
        const streamImage = document.getElementById('streamImage') || 
                          document.getElementById('cameraStream') ||
                          document.createElement('img');
        const cameraContainer = videoPlaceholder ? 
                              videoPlaceholder.parentElement : 
                              document.querySelector('.card-body');
        
        // Verificar si tenemos los elementos necesarios
        if (videoPlaceholder && cameraContainer) {
            // Asegurarse de que streamImage esté configurado correctamente
            if (!streamImage.id) streamImage.id = 'streamImage';
            streamImage.className = 'img-fluid';
            streamImage.alt = 'Stream de la cámara';
            
            // Configurar la fuente del stream y forzar la carga
            const streamUrl = `http://${ipAddress}${CAMERA_CONFIG.streamPath}`;
            
            streamImage.onerror = function() {
                console.error('Error al cargar la imagen de la cámara:', streamUrl);
                
                // Si hay error, mostrar mensaje
                videoPlaceholder.innerHTML = `
                    <span class="record-indicator" id="recordIndicator">REC</span>
                    <div class="mt-4">
                        <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
                        <p class="text-danger mt-2">Error al conectar con la cámara: ${ipAddress}</p>
                        <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                            <i class="fas fa-sync-alt me-1"></i> Reintentar
                        </button>
                    </div>
                `;
                videoPlaceholder.style.display = 'block';
            };
            
            streamImage.onload = function() {
                console.log('Stream de la cámara cargado correctamente');
                videoPlaceholder.style.display = 'none';
            };
            
            // Forzar la visualización del stream
            streamImage.src = streamUrl;
            
            if (!streamImage.parentElement) {
                cameraContainer.appendChild(streamImage);
            } else {
                streamImage.style.display = 'block';
            }
            
            console.log('Forzando conexión a la cámara IP:', ipAddress);
        } else {
            console.error('No se encontraron los elementos necesarios para mostrar el stream');
        }
    } catch (error) {
        console.error('Error al intentar mostrar el stream de la cámara:', error);
    }
}

// Inicialización de botones de control
function initControlButtons() {
    const controlButtons = document.querySelectorAll('.control-btn');
    
    controlButtons.forEach(button => {
        // Evento al presionar (mousedown/touchstart)
        ['mousedown', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, () => {
                const direction = button.id;
                activeControls.add(direction);
                button.classList.add('control-active');
                
                // Añadir animación al icono
                const icon = button.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-beat');
                }
                
                // Enviar comando al carrito
                sendControlCommand(direction, true);
            });
        });
        
        // Evento al soltar (mouseup/touchend)
        ['mouseup', 'touchend', 'mouseleave'].forEach(eventType => {
            button.addEventListener(eventType, () => {
                const direction = button.id;
                if (activeControls.has(direction)) {
                    activeControls.delete(direction);
                    button.classList.remove('control-active');
                    
                    // Quitar animación del icono
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-beat');
                    }
                    
                    // Detener comando
                    sendControlCommand(direction, false);
                }
            });
        });
    });
    
    // Botón de parada completa
    document.getElementById('stop').addEventListener('click', () => {
        // Limpiar todos los controles activos
        activeControls.forEach(control => {
            document.getElementById(control).classList.remove('control-active');
        });
        activeControls.clear();
        
        // Enviar comando de parada
        sendControlCommand('stop', true);
    });
}

// Inicialización de controles deslizantes
function initRangeSliders() {
    // Control de velocidad
    const speedRange = document.getElementById('speedRange');
    const speedValue = document.getElementById('speedValue');
    
    speedRange.addEventListener('input', () => {
        const value = speedRange.value;
        speedValue.textContent = value;
        
        // Enviar valor de velocidad al carrito
        sendSpeedCommand(value);
    });
    
    // Control de volumen
    const volumeRange = document.getElementById('volumeRange');
    const volumeValue = document.getElementById('volumeValue');
    
    volumeRange.addEventListener('input', () => {
        const value = volumeRange.value;
        volumeValue.textContent = value;
        
        // Aplicar volumen al audio
        setAudioVolume(value);
    });
}

// Inicialización de botones de audio
function initAudioButtons() {
    const startButton = document.getElementById('audioStart');
    const stopButton = document.getElementById('audioStop');
    const muteButton = document.getElementById('audioMute');
    
    startButton.addEventListener('click', () => {
        isAudioPlaying = true;
        startAudio();
        startButton.disabled = true;
        stopButton.disabled = false;
    });
    
    stopButton.addEventListener('click', () => {
        isAudioPlaying = false;
        stopAudio();
        startButton.disabled = false;
        stopButton.disabled = true;
    });
    
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        setAudioMute(isMuted);
        muteButton.innerHTML = isMuted ? 
            '<i class="fas fa-volume-up"></i> Activar Sonido' : 
            '<i class="fas fa-volume-mute"></i> Silenciar';
    });
    
    // Estado inicial
    stopButton.disabled = true;
}

// Simulación de detección de sonido
function simulateSoundDetection(micId) {
    const mic = document.getElementById(micId);
    if (!mic) return;
    
    // Activar el micrófono
    mic.setAttribute('data-active', 'true');
    
    // Desactivar después de un tiempo
    setTimeout(() => {
        mic.setAttribute('data-active', 'false');
    }, 2000);
}

// Función para inicializar los toggler de micrófonos
function initMicToggles() {
    document.querySelectorAll('.mic-toggles .form-check-input').forEach(toggle => {
        toggle.addEventListener('change', function() {
            const micId = this.id.replace('toggle', 'mic');
            const isActive = this.checked;
            document.getElementById(micId).setAttribute('data-active', isActive);
            sendMicCommand(micId, isActive);
        });
    });
}

// Inicialización del panel de historial
function initHistoryPanel() {
    const toggleBtn = document.getElementById('toggleHistory');
    const historyPanel = document.querySelector('.history-panel');
    
    toggleBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('collapsed');
        const isCollapsed = historyPanel.classList.contains('collapsed');
        toggleBtn.innerHTML = isCollapsed ? 
            '<i class="fas fa-chevron-up"></i>' : 
            '<i class="fas fa-chevron-down"></i>';
    });
}

// Inicialización de gráficos
function initCharts() {
    // Configuración común
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        scales: {
            x: {
                display: false
            },
            y: {
                beginAtZero: false
            }
        },
        elements: {
            line: {
                tension: 0.4
            },
            point: {
                radius: 3
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        }
    };
    
    // Gráfico de temperatura
    const temperatureCtx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(temperatureCtx, {
        type: 'line',
        data: {
            labels: Array(CONFIG.chartMaxPoints).fill(''),
            datasets: [{
                label: 'Temperatura (°C)',
                data: Array(CONFIG.chartMaxPoints).fill(null),
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                fill: true
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    beginAtZero: false,
                    suggestedMin: 15,
                    suggestedMax: 40
                }
            }
        }
    });
    
    // Gráfico de humedad
    const humidityCtx = document.getElementById('humidityChart').getContext('2d');
    humidityChart = new Chart(humidityCtx, {
        type: 'line',
        data: {
            labels: Array(CONFIG.chartMaxPoints).fill(''),
            datasets: [{
                label: 'Humedad (%)',
                data: Array(CONFIG.chartMaxPoints).fill(null),
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.2)',
                fill: true
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    beginAtZero: false,
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

// Actualización de datos de sensores
function updateSensorData() {
    // En un caso real, aquí obtendrías datos del servidor mediante fetch o websocket
    // Para este ejemplo, generamos datos aleatorios
    
    // Temperatura (entre 18 y 32°C con pequeñas variaciones)
    const currentTemp = document.getElementById('temperatureValue').textContent.replace('°C', '');
    let temperature = Number(currentTemp);
    temperature += (Math.random() - 0.5) * 0.5;
    temperature = Math.round(temperature * 10) / 10;
    
    // Humedad (entre 40% y 80% con pequeñas variaciones)
    const currentHum = document.getElementById('humidityValue').textContent.replace('%', '');
    let humidity = Number(currentHum);
    humidity += (Math.random() - 0.5) * 1;
    humidity = Math.max(0, Math.min(100, Math.round(humidity)));
    
    // Nivel de humo (aleatoriamente puede cambiar)
    let smokeStatus = 'Normal';
    if (Math.random() > 0.95) {
        smokeStatus = 'Detectado';
    }
    
    // Detección de lluvia (aleatoriamente puede cambiar)
    let rainStatus = 'No detectada';
    if (Math.random() > 0.9) {
        rainStatus = 'Detectada';
    }
    
    // Proximidad (entre 10 y 100 cm con cambios aleatorios)
    const currentProx = document.getElementById('proximityValue').textContent.replace(' cm', '');
    let proximity = Number(currentProx);
    proximity += (Math.random() - 0.5) * 5;
    proximity = Math.max(5, Math.min(100, Math.round(proximity)));
    
    // Aplicar efecto de actualización digital a todas las tarjetas de sensores
    document.querySelectorAll('.sensor-card').forEach(card => {
        // Efecto de actualización de datos
        card.classList.add('glitch-effect');
        setTimeout(() => {
            card.classList.remove('glitch-effect');
        }, 500);
    });
    
    // Actualizar los valores en la interfaz
    updateTemperature(temperature);
    updateHumidity(humidity);
    updateSmokeDetection(smokeStatus);
    updateRainDetection(rainStatus);
    updateProximity(proximity);
    
    // Actualizar detección de sonido (aleatoria para demostración)
    const mics = ['micFront', 'micRight', 'micBack', 'micLeft'];
    mics.forEach(mic => {
        if (Math.random() > 0.8) {
            simulateSoundDetection(mic);
        }
    });
    
    // Actualizar gráficas
    updateCharts(temperature, humidity);
}

// Actualización específica de cada sensor
function updateTemperature(value) {
    const tempElement = document.getElementById('temperatureValue');
    tempElement.textContent = `${value}°C`;
    
    // Actualizar escala visual
    const scaleBar = document.querySelector('.temperature-scale');
    if (scaleBar) {
        // Mapear la temperatura (0-50°C) a un porcentaje para la barra (0-100%)
        const percentage = Math.max(0, Math.min(100, (value / 50) * 100));
        scaleBar.style.width = `${percentage}%`;
        
        // Cambiar el brillo según la temperatura
        const brightness = Math.max(0.7, Math.min(1.3, value / 25));
        scaleBar.style.filter = `brightness(${brightness})`;
        
        // Efecto de pulso para temperaturas críticas
        if (value > 30 || value < 10) {
            scaleBar.style.animation = 'scalePulse 1s infinite alternate';
        } else {
            scaleBar.style.animation = 'none';
        }
    }
    
    // Aplicar clases según límites
    tempElement.classList.remove('sensor-critical');
    if (value > 30 || value < 10) {
        tempElement.classList.add('sensor-critical');
    }
}

function updateHumidity(value) {
    const humElement = document.getElementById('humidityValue');
    humElement.textContent = `${value}%`;
    
    // Actualizar escala visual
    const scaleBar = document.querySelector('.humidity-scale');
    if (scaleBar) {
        // La humedad ya está en porcentaje (0-100%)
        scaleBar.style.width = `${value}%`;
        
        // Ajustar colores según el nivel de humedad
        if (value < 30) {
            scaleBar.style.filter = 'hue-rotate(-20deg) saturate(1.2)';
        } else if (value > 70) {
            scaleBar.style.filter = 'hue-rotate(20deg) saturate(1.2)';
        } else {
            scaleBar.style.filter = 'none';
        }
        
        // Efecto de pulso para humedad crítica
        if (value > 85 || value < 20) {
            scaleBar.style.animation = 'scalePulse 1s infinite alternate';
        } else {
            scaleBar.style.animation = 'none';
        }
    }
    
    // Aplicar clases según límites
    humElement.classList.remove('sensor-critical');
    if (value > 85 || value < 20) {
        humElement.classList.add('sensor-critical');
    }
}

function updateSmokeDetection(status) {
    const smokeElement = document.getElementById('smokeValue');
    smokeElement.textContent = status;
    
    // Aplicar clases según estado
    smokeElement.classList.remove('sensor-critical', 'sensor-pulse');
    if (status !== 'Normal') {
        smokeElement.classList.add('sensor-critical', 'sensor-pulse');
    }
}

function updateRainDetection(status) {
    const rainElement = document.getElementById('rainValue');
    rainElement.textContent = status;
    
    // Aplicar clases según estado
    rainElement.classList.remove('sensor-critical', 'sensor-pulse');
    if (status !== 'No detectada') {
        rainElement.classList.add('sensor-pulse');
    }
}

function updateProximity(value) {
    const proximityElement = document.getElementById('proximityValue');
    const proximityBar = document.getElementById('proximityBar');
    
    // Actualizar el texto con el formato deseado
    proximityElement.textContent = `${value} cm`;
    
    // La barra de proximidad se invierte - más pequeña significa más lejos
    const barWidth = Math.max(5, Math.min(90, 100 - value));
    proximityBar.style.width = `${barWidth}%`;
    
    // Efectos según la proximidad con nuevos colores azules
    if (value <= CONFIG.proximityThresholds.danger) {
        // Objeto cercano - peligro
        proximityBar.style.background = 'linear-gradient(90deg, #d73a49, #e85c33)';
        proximityElement.style.color = '#d73a49';
    } else if (value <= CONFIG.proximityThresholds.warning) {
        // Objeto a distancia media - precaución
        proximityBar.style.background = 'linear-gradient(90deg, #1a7cb8, #50b0e8)';
        proximityElement.style.color = '#50b0e8';
    } else {
        // Objeto lejano - seguro
        proximityBar.style.background = 'linear-gradient(90deg, #0a4c7f, #1a7cb8)';
        proximityElement.style.color = '#1a7cb8';
    }
    
    // Actualizar también la visualización del radar
    updateRadarVisualization(value);
}

function updateRadarVisualization(proximityValue) {
    const radarObject = document.getElementById('radarObject');
    if (!radarObject) return;
    
    // Normalizar el valor de proximidad (0-100)
    const normalizedValue = Math.min(100, proximityValue) / 100;
    
    // Para una visualización más simple y elegante sin animación giratoria
    // Posicionamos el objeto en un ángulo fijo y solo variamos la distancia
    
    // Ángulo fijo en el centro del semicírculo (90 grados o π/2 radianes)
    const angle = Math.PI / 2;
    
    // La distancia desde el centro es inversamente proporcional a la proximidad
    // Objetos cercanos (proximidad baja) deberían estar más cerca del centro
    const distance = (1 - (normalizedValue * 0.8)) * 80; // 80% del radio
    
    // Convertir coordenadas polares a cartesianas
    const x = 50 + Math.cos(angle) * distance; // 50% es el centro horizontal
    const y = 100 - Math.sin(angle) * distance; // Invertido porque 0,0 está en la esquina superior izquierda
    
    // Posicionar el objeto con una transición suave
    radarObject.style.transition = "left 0.5s ease, top 0.5s ease";
    radarObject.style.left = `${x}%`;
    radarObject.style.top = `${y}%`;
    
    // Ajustar el brillo según la proximidad - objetos más cercanos brillan más
    const glow = 5 + (1 - normalizedValue) * 15; // Entre 5px y 20px de brillo
    radarObject.style.boxShadow = `0 0 ${glow}px #50b0e8`; // Color azul claro en lugar de naranja
    
    // Objetos más cercanos son más visibles
    const opacity = 0.7 + (1 - normalizedValue) * 0.3; // Entre 0.7 y 1.0 de opacidad
    radarObject.style.opacity = opacity.toString();
}

// Cambiar en la función de los sensores
// Modificar las funciones relacionadas con los sensores para usar azules en lugar de naranjas
function updateSensorStyles() {
    // Actualizar estilos de las tarjetas de sensores
    document.querySelectorAll('.sensor-scale').forEach(scale => {
        scale.style.boxShadow = '0 0 8px rgba(80, 176, 232, 0.5)'; // Azul en lugar de naranja
    });
    
    // Actualizar iconos de sensores
    document.querySelectorAll('.sensor-icon:after').forEach(icon => {
        icon.style.background = `conic-gradient(
            transparent, 
            rgba(26, 124, 184, 0.2), 
            transparent 30%,
            transparent 70%, 
            rgba(26, 124, 184, 0.2), 
            transparent
        )`; // Azul en lugar de naranja
    });
    
    // Actualizar efectos de hover para iconos de sensores
    document.querySelectorAll('.sensor-card:hover .sensor-icon').forEach(icon => {
        icon.style.color = '#1a7cb8'; // Azul en lugar de naranja
        icon.style.boxShadow = '0 0 15px rgba(26, 124, 184, 0.4), 0 0 5px rgba(26, 124, 184, 0.2)'; // Azul en lugar de naranja
    });
}

// Actualización de las gráficas de historial
function updateCharts(temperature, humidity) {
    // Agregar nuevos datos a las gráficas
    const time = new Date().toLocaleTimeString();
    
    // Actualizar datos de temperatura
    temperatureChart.data.labels.push(time);
    temperatureChart.data.datasets[0].data.push(temperature);
    
    // Limitar a un número máximo de puntos
    if (temperatureChart.data.labels.length > CONFIG.chartMaxPoints) {
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
    }
    
    // Actualizar datos de humedad
    humidityChart.data.labels.push(time);
    humidityChart.data.datasets[0].data.push(humidity);
    
    // Limitar a un número máximo de puntos
    if (humidityChart.data.labels.length > CONFIG.chartMaxPoints) {
        humidityChart.data.labels.shift();
        humidityChart.data.datasets[0].data.shift();
    }
    
    // Actualizar gráficas
    temperatureChart.update();
    humidityChart.update();
}

// Funciones de comunicación con el carrito
function sendControlCommand(direction, isActive) {
    console.log(`Control: ${direction}, Estado: ${isActive ? 'Activado' : 'Desactivado'}`);
    // Aquí se implementaría el envío real al servidor/carrito
}

function sendSpeedCommand(speed) {
    console.log(`Velocidad establecida: ${speed}%`);
    // Aquí se implementaría el envío real al servidor/carrito
}

function startAudio() {
    console.log('Iniciando transmisión de audio');
    // Aquí se implementaría la lógica real para iniciar el audio
}

function stopAudio() {
    console.log('Deteniendo transmisión de audio');
    // Aquí se implementaría la lógica real para detener el audio
}

function setAudioVolume(volume) {
    console.log(`Volumen establecido: ${volume}%`);
    // Aquí se implementaría la lógica real para cambiar el volumen
}

function setAudioMute(muted) {
    console.log(`Audio ${muted ? 'silenciado' : 'activado'}`);
    // Aquí se implementaría la lógica real para silenciar/activar el audio
}

function sendMicCommand(micId, isEnabled) {
    console.log(`Micrófono ${micId}: ${isEnabled ? 'Activado' : 'Desactivado'}`);
    // Aquí se implementaría el envío real al servidor/carrito
}

// Modo demostración para pruebas
function startDemoMode() {
    console.log('Iniciando modo demostración');
    
    // Simular cambios aleatorios en los valores de los sensores
    setInterval(() => {
        // Simular movimiento del carrito
        const directions = ['forward', 'left', 'right', 'backward', 'stop'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        // Limpiar controles activos
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.classList.remove('control-active');
        });
        
        // Activar control aleatorio brevemente
        if (randomDirection !== 'stop') {
            const btn = document.getElementById(randomDirection);
            if (btn) {
                btn.classList.add('control-active');
                setTimeout(() => {
                    btn.classList.remove('control-active');
                }, 500);
            }
        }
        
        // Simular detección de audio
        simulateSoundDetection(`mic${['Front', 'Right', 'Back', 'Left'][Math.floor(Math.random() * 4)]}`);
        
    }, 3000);
}

// Configuración de la cámara
const CAMERA_CONFIG = {
    defaultIP: '192.168.103.177', // Dejar vacío o establecer una IP predeterminada
    streamPath: '/stream',
    flashPath: '/flash', // Ruta para controlar el flash
    capturePath: '/capture', // Ruta para capturar fotos
    reconnectInterval: 3000 // Intervalo para intentar reconectar (ms)
};

// Inicialización de la cámara
function initCameraControls() {
    const connectButton = document.getElementById('connectCamera');
    const cameraIPInput = document.getElementById('cameraIP');
    const cameraStream = document.getElementById('cameraStream');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const toggleFlashButton = document.getElementById('toggleFlash'); // Botón para flash
    const capturePhotoButton = document.getElementById('capturePhoto'); // Botón para tomar foto

    // Variable para rastrear el estado del flash
    let flashState = false;

    // Cargar IP guardada (si existe)
    const savedIP = localStorage.getItem('cameraIP');
    if (savedIP) {
        cameraIPInput.value = savedIP;
    }

    // Evento para conectar a la cámara
    connectButton.addEventListener('click', () => {
        const ip = cameraIPInput.value.trim();
        if (!ip) {
            alert('Por favor, ingrese una dirección IP válida.');
            return;
        }

        // Guardar IP en localStorage
        localStorage.setItem('cameraIP', ip);

        // Intentar conectar al stream
        connectToCamera(ip, cameraStream, videoPlaceholder);
    });

    // Evento para cambiar resolución
    resolutionSelect.addEventListener('change', () => {
        const resolution = resolutionSelect.value;
        const ip = cameraIPInput.value.trim();
        if (ip) {
            changeCameraResolution(ip, resolution);
        }
    });

    // Evento para alternar flash
    toggleFlashButton.addEventListener('click', () => {
        const ip = cameraIPInput.value.trim();
        if (!ip) {
            alert('Por favor, conecte a una cámara primero.');
            return;
        }
        flashState = !flashState;
        toggleFlash(ip);
        toggleFlashButton.innerHTML = flashState ? 
            `<i class="fas fa-lightbulb"></i> Apagar Flash` : 
            `<i class="fas fa-lightbulb"></i> Encender Flash`;
    });

    // Evento para capturar foto
    capturePhotoButton.addEventListener('click', () => {
        const ip = cameraIPInput.value.trim();
        if (!ip) {
            alert('Por favor, conecte a una cámara primero.');
            return;
        }
        capturePhoto(ip);
    });

    // Intentar conectar automáticamente si hay una IP guardada
    if (savedIP) {
        connectToCamera(savedIP, cameraStream, videoPlaceholder);
    }
}

// Conectar al stream de la cámara
function connectToCamera(ip, streamElement, placeholderElement) {
    const streamUrl = `http://${ip}${CAMERA_CONFIG.streamPath}`;
    streamElement.src = streamUrl;

    // Mostrar placeholder mientras se conecta
    streamElement.style.visibility = 'hidden';
    placeholderElement.style.display = 'flex';

    // Manejar eventos de carga y error
    streamElement.onload = () => {
        streamElement.style.visibility = 'visible';
        placeholderElement.style.display = 'none';
        console.log(`Conectado al stream: ${streamUrl}`);
    };

    streamElement.onerror = () => {
        streamElement.style.visibility = 'hidden';
        placeholderElement.style.display = 'flex';
        console.error(`Error al conectar al stream: ${streamUrl}`);
        // Intentar reconectar después de un intervalo
        setTimeout(() => connectToCamera(ip, streamElement, placeholderElement), CAMERA_CONFIG.reconnectInterval);
    };
}

// Alternar el estado del flash
function toggleFlash(ip) {
    const url = `http://${ip}${CAMERA_CONFIG.flashPath}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Error al cambiar estado del flash');
            return response.text();
        })
        .then(text => {
            console.log(`Flash: ${text}`);
        })
        .catch(error => {
            console.error(`Error al cambiar el flash: ${error}`);
            alert('No se pudo cambiar el estado del flash.');
        });
}

// Capturar y descargar una foto
function capturePhoto(ip) {
    const url = `http://${ip}${CAMERA_CONFIG.capturePath}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Error al capturar foto');
            return response.blob();
        })
        .then(blob => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `photo-${timestamp}.jpg`;
            link.click();
            URL.revokeObjectURL(link.href);
            console.log('Foto capturada y descargada');
        })
        .catch(error => {
            console.error(`Error al capturar foto: ${error}`);
            alert('No se pudo capturar la foto.');
        });
}

// Cambiar resolución de la cámara
function changeCameraResolution(ip, resolution) {
    // Enviar solicitud HTTP al ESP32-CAM para cambiar resolución
    const url = `http://${ip}/resolution?size=${resolution}`;
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Error al cambiar resolución');
            console.log(`Resolución cambiada a ${resolution}`);
        })
        .catch(error => {
            console.error(`Error al cambiar resolución: ${error}`);
            alert('No se pudo cambiar la resolución. Verifique la conexión con la cámara.');
        });
}

// Simulación de conexión WebSocket (en lugar de una implementación real)
console.log('Simulando conexión WebSocket con el carrito...');
setTimeout(() => {
    console.log('Conexión establecida con éxito');
}, 1000);