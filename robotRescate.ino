#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <ESP32Servo.h>
#include <ESPmDNS.h>

// Credenciales WiFi
const char* ssid = "Redmi";
const char* password = "123abc02";

// Pines
#define PIN_DHT 4        // DHT22 (temperatura y humedad)
#define PIN_MQ7 35       // Sensor de humo (MQ-7)
#define PIN_LLUVIA 34    // Sensor de lluvia (ADC)
#define PIN_TRIG 5       // HC-SR04 (Trigger)
#define PIN_ECHO 18      // HC-SR04 (Echo)
#define PIN_IN1 25       // L298N Motor 1 (avanzar/retroceder)
#define PIN_IN2 26       // L298N Motor 1
#define PIN_ENA 27       // L298N Motor 1 (PWM velocidad)
#define PIN_IN3 14       // L298N Motor 2 (izquierda/derecha)
#define PIN_IN4 12       // L298N Motor 2
#define PIN_ENB 13       // L298N Motor 2 (PWM velocidad)
#define PIN_IN5 19       // L298N Motor 3 (subir/bajar rueda)
#define PIN_IN6 23       // L298N Motor 3
#define PIN_SERVO 15     // Servo de 360 grados

// Configuración DHT
#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// Configuración del Servo
Servo servo360;
int servoSpeed = 90; // 90 = detenido, 0 = antihorario, 180 = horario

// Servidor y WebSocket
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// Cola para comandos
QueueHandle_t commandQueue;
struct Command {
    String direction;
    int speed;
};

// Variables para Motor 3
volatile bool wheelActive = false;
volatile unsigned long wheelStartTime = 0;
bool wheelDirectionForward = true;

void setup() {
    Serial.begin(115200);
    
    // Configurar pines
    pinMode(PIN_TRIG, OUTPUT);
    pinMode(PIN_ECHO, INPUT);
    pinMode(PIN_LLUVIA, INPUT);
    pinMode(PIN_MQ7, INPUT);
    pinMode(PIN_IN1, OUTPUT);
    pinMode(PIN_IN2, OUTPUT);
    pinMode(PIN_IN3, OUTPUT);
    pinMode(PIN_IN4, OUTPUT);
    pinMode(PIN_IN5, OUTPUT);
    pinMode(PIN_IN6, OUTPUT);
    
    // Inicializar pines en LOW
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, LOW);
    digitalWrite(PIN_IN3, LOW);
    digitalWrite(PIN_IN4, LOW);
    digitalWrite(PIN_IN5, LOW);
    digitalWrite(PIN_IN6, LOW);
    
    // Configurar PWM para ENA y ENB
    ledcAttachChannel(PIN_ENA, 5000, 8, 0); // Canal 0
    ledcAttachChannel(PIN_ENB, 5000, 8, 1); // Canal 1
    
    // Configurar el servo
    servo360.attach(PIN_SERVO);
    servo360.write(servoSpeed); // Inicializar detenido
    
    // Iniciar DHT
    dht.begin();
    
    // Conectar a WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Conectando a WiFi...");
    }
    Serial.println("Conectado a WiFi. IP: " + WiFi.localIP().toString());
    
    // Iniciar mDNS
    if (!MDNS.begin("esp32")) {
        Serial.println("Error al iniciar mDNS");
    } else {
        Serial.println("mDNS iniciado: esp32.local");
    }
    
    // Crear cola
    commandQueue = xQueueCreate(10, sizeof(Command));
    
    // Configurar CORS
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");
    
    // Configurar WebSocket
    ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
        if (type == WS_EVT_CONNECT) {
            Serial.println("Cliente WebSocket conectado, ID: " + String(client->id()));
            client->text("Conectado al servidor ESP32");
        } else if (type == WS_EVT_DISCONNECT) {
            Serial.println("Cliente WebSocket desconectado, ID: " + String(client->id()));
        } else if (type == WS_EVT_DATA) {
            String message = "";
            for (size_t i = 0; i < len; i++) {
                message += (char)data[i];
            }
            Serial.println("Mensaje WebSocket recibido: " + message);
            
            // Procesar comandos
            if (message == "toggleWheel" || message == "clockwise" || message == "counterclockwise" || message == "stopServo") {
                Command cmd;
                cmd.direction = message;
                cmd.speed = 100; // Velocidad por defecto
                xQueueSend(commandQueue, &cmd, portMAX_DELAY);
            } else {
                // Intentar parsear como JSON
                StaticJsonDocument<200> doc;
                DeserializationError error = deserializeJson(doc, message);
                if (!error) {
                    Command cmd;
                    cmd.direction = doc["direction"].as<String>();
                    cmd.speed = doc["speed"] | 100;
                    xQueueSend(commandQueue, &cmd, portMAX_DELAY);
                } else {
                    Serial.println("Error al parsear JSON: " + String(error.c_str()));
                }
            }
        }
    });
    
    server.addHandler(&ws);
    
    // Ruta para sensores (mantenida para compatibilidad)
    server.on("/sensors", HTTP_GET, [](AsyncWebServerRequest *request) {
        StaticJsonDocument<200> doc;
        doc["lluvia"] = analogRead(PIN_LLUVIA);
        doc["humo"] = analogRead(PIN_MQ7);
        float temp = dht.readTemperature();
        float hum = dht.readHumidity();
        doc["temperatura"] = isnan(temp) ? 0 : temp;
        doc["humedad"] = isnan(hum) ? 0 : hum;
        digitalWrite(PIN_TRIG, LOW);
        delayMicroseconds(2);
        digitalWrite(PIN_TRIG, HIGH);
        delayMicroseconds(10);
        digitalWrite(PIN_TRIG, LOW);
        long duration = pulseIn(PIN_ECHO, HIGH);
        doc["proximidad"] = duration * 0.034 / 2;
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // Ruta para control de motores
    server.on("/control", HTTP_GET, [](AsyncWebServerRequest *request) {
        String direction = request->hasParam("direction") ? request->getParam("direction")->value() : "stop";
        int speed = request->hasParam("speed") ? request->getParam("speed")->value().toInt() : 100;
        Serial.println("Ruta /control recibida: direction=" + direction + ", speed=" + String(speed));
        Command cmd;
        cmd.direction = direction;
        cmd.speed = constrain(speed, 0, 100);
        xQueueSend(commandQueue, &cmd, portMAX_DELAY);
        StaticJsonDocument<100> response;
        response["status"] = "OK";
        response["direction"] = direction;
        response["speed"] = speed;
        String jsonResponse;
        serializeJson(response, jsonResponse);
        request->send(200, "application/json", jsonResponse);
    });
    
    // Ruta para control del servo
    server.on("/controlServo", HTTP_GET, [](AsyncWebServerRequest *request) {
        String direction = request->hasParam("direction") ? request->getParam("direction")->value() : "stopServo";
        int speed = request->hasParam("speed") ? request->getParam("speed")->value().toInt() : 100;
        Serial.println("Ruta /controlServo recibida: direction=" + direction + ", speed=" + String(speed));
        Command cmd;
        cmd.direction = direction;
        cmd.speed = constrain(speed, 0, 100);
        xQueueSend(commandQueue, &cmd, portMAX_DELAY);
        StaticJsonDocument<100> response;
        response["status"] = "OK";
        response["direction"] = direction;
        response["speed"] = speed;
        String jsonResponse;
        serializeJson(response, jsonResponse);
        request->send(200, "application/json", jsonResponse);
    });
    
    // Iniciar servidor
    server.begin();
    Serial.println("Servidor web iniciado");
    
    // Crear tareas
    xTaskCreatePinnedToCore(mainMotorTask, "MainMotorTask", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(wheelMotorTask, "WheelMotorTask", 4096, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(servoTask, "ServoTask", 4096, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(sensorUpdateTask, "SensorUpdateTask", 4096, NULL, 1, NULL, 1);
}

void loop() {
    ws.cleanupClients();
    delay(100);
}

void sensorUpdateTask(void *pvParameters) {
    while (1) {
        StaticJsonDocument<200> doc;
        doc["lluvia"] = analogRead(PIN_LLUVIA);
        doc["humo"] = analogRead(PIN_MQ7);
        float temp = dht.readTemperature();
        float hum = dht.readHumidity();
        doc["temperatura"] = isnan(temp) ? 0 : temp;
        doc["humedad"] = isnan(hum) ? 0 : hum;
        digitalWrite(PIN_TRIG, LOW);
        delayMicroseconds(2);
        digitalWrite(PIN_TRIG, HIGH);
        delayMicroseconds(10);
        digitalWrite(PIN_TRIG, LOW);
        long duration = pulseIn(PIN_ECHO, HIGH);
        doc["proximidad"] = duration * 0.034 / 2;

        String response;
        serializeJson(doc, response);
        ws.textAll(response); // Enviar a todos los clientes conectados
        vTaskDelay(2000 / portTICK_PERIOD_MS); // Actualizar cada 2 segundos
    }
}

void mainMotorTask(void *pvParameters) {
    while (1) {
        if (uxQueueMessagesWaiting(commandQueue) > 0) {
            Command command;
            if (xQueueReceive(commandQueue, &command, 0)) {
                if (command.direction != "toggleWheel" && command.direction != "clockwise" && 
                    command.direction != "counterclockwise" && command.direction != "stopServo") {
                    Serial.println("Procesando comando (motores principales): " + command.direction + ", velocidad: " + String(command.speed));
                    Serial.printf("Estado pines: IN1=%d, IN2=%d, IN3=%d, IN4=%d, ENA=%d, ENB=%d\n",
                                  digitalRead(PIN_IN1), digitalRead(PIN_IN2),
                                  digitalRead(PIN_IN3), digitalRead(PIN_IN4),
                                  ledcRead(0), ledcRead(1));
                    if (command.direction == "forward") {
                        digitalWrite(PIN_IN1, HIGH);
                        digitalWrite(PIN_IN2, LOW);
                        digitalWrite(PIN_IN3, HIGH);
                        digitalWrite(PIN_IN4, LOW);
                        ledcWrite(0, command.speed * 2.55);
                        ledcWrite(1, command.speed * 2.55);
                    } else if (command.direction == "backward") {
                        digitalWrite(PIN_IN1, LOW);
                        digitalWrite(PIN_IN2, HIGH);
                        digitalWrite(PIN_IN3, LOW);
                        digitalWrite(PIN_IN4, HIGH);
                        ledcWrite(0, command.speed * 2.55);
                        ledcWrite(1, command.speed * 2.55);
                    } else if (command.direction == "left") {
                        digitalWrite(PIN_IN1, LOW);
                        digitalWrite(PIN_IN2, HIGH);
                        digitalWrite(PIN_IN3, HIGH);
                        digitalWrite(PIN_IN4, LOW);
                        ledcWrite(0, command.speed * 2.55);
                        ledcWrite(1, command.speed * 2.55);
                    } else if (command.direction == "right") {
                        digitalWrite(PIN_IN1, HIGH);
                        digitalWrite(PIN_IN2, LOW);
                        digitalWrite(PIN_IN3, LOW);
                        digitalWrite(PIN_IN4, HIGH);
                        ledcWrite(0, command.speed * 2.55);
                        ledcWrite(1, command.speed * 2.55);
                    } else if (command.direction == "stop") {
                        digitalWrite(PIN_IN1, LOW);
                        digitalWrite(PIN_IN2, LOW);
                        digitalWrite(PIN_IN3, LOW);
                        digitalWrite(PIN_IN4, LOW);
                        ledcWrite(0, 0);
                        ledcWrite(1, 0);
                    }
                    Serial.printf("Nuevo estado pines: IN1=%d, IN2=%d, IN3=%d, IN4=%d, ENA=%d, ENB=%d\n",
                                  digitalRead(PIN_IN1), digitalRead(PIN_IN2),
                                  digitalRead(PIN_IN3), digitalRead(PIN_IN4),
                                  ledcRead(0), ledcRead(1));
                }
            }
        }
        vTaskDelay(50 / portTICK_PERIOD_MS);
    }
}

void wheelMotorTask(void *pvParameters) {
    while (1) {
        if (uxQueueMessagesWaiting(commandQueue) > 0) {
            Command command;
            if (xQueueReceive(commandQueue, &command, 0)) {
                if (command.direction == "toggleWheel") {
                    Serial.println("Procesando comando toggleWheel");
                    wheelActive = true;
                    wheelStartTime = millis();
                    if (wheelDirectionForward) {
                        digitalWrite(PIN_IN5, HIGH);
                        digitalWrite(PIN_IN6, LOW);
                        ws.textAll("Subir Rueda");
                        Serial.println("Motor 3: Subir Rueda");
                    } else {
                        digitalWrite(PIN_IN5, LOW);
                        digitalWrite(PIN_IN6, HIGH);
                        ws.textAll("Bajar Rueda");
                        Serial.println("Motor 3: Bajar Rueda");
                    }
                    wheelDirectionForward = !wheelDirectionForward;
                }
            }
        }
        if (wheelActive && millis() - wheelStartTime >= 500) {
            digitalWrite(PIN_IN5, LOW);
            digitalWrite(PIN_IN6, LOW);
            wheelActive = false;
            Serial.println("Motor 3 detenido");
            ws.textAll("Motor detenido");
        }
        vTaskDelay(1 / portTICK_PERIOD_MS);
    }
}

void servoTask(void *pvParameters) {
    while (1) {
        if (uxQueueMessagesWaiting(commandQueue) > 0) {
            Command command;
            if (xQueueReceive(commandQueue, &command, 0)) {
                if (command.direction == "clockwise" || command.direction == "counterclockwise" || command.direction == "stopServo") {
                    Serial.println("Procesando comando (servo): " + command.direction + ", velocidad: " + String(command.speed));
                    if (command.direction == "clockwise") {
                        servoSpeed = map(command.speed, 0, 100, 90, 180);
                        servo360.write(servoSpeed);
                        ws.textAll("Servo: Rotando en sentido horario");
                    } else if (command.direction == "counterclockwise") {
                        servoSpeed = map(command.speed, 0, 100, 90, 0);
                        servo360.write(servoSpeed);
                        ws.textAll("Servo: Rotando en sentido antihorario");
                    } else if (command.direction == "stopServo") {
                        servoSpeed = 90;
                        servo360.write(servoSpeed);
                        ws.textAll("Servo detenido");
                    }
                }
            }
        }
        vTaskDelay(50 / portTICK_PERIOD_MS);
    }
}