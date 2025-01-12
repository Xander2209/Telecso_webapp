#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Definición de pines
#define DHTPIN 13
#define DHTTYPE DHT22
#define DOOR_SENSOR_PIN 23  // Pin para el sensor de puerta

// Configuración WiFi
const char* ssid = "La_Familia";
const char* password = "A#26pdqVMexld";
const char* serverUrl = "http://192.168.100.141:3001/api/sensors";

// Configuración del dispositivo
const char* deviceName = "Sensor_2";  // Cambiar para cada dispositivo
const char* location = "Almacen_2";   // Cambiar para cada dispositivo
uint32_t chipId = ESP.getEfuseMac();

// Inicialización de sensores
DHT dht(DHTPIN, DHTTYPE);
unsigned long previousMillis = 0;
const long interval = 60000;  // Intervalo de 60 segundos

void setup() {
  Serial.begin(115200);
  
  // Inicializar sensores
  dht.begin();
  pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando a WiFi...");
  }
  
  // Mostrar información de inicio
  Serial.println("Conectado al WiFi");
  Serial.print("ID del dispositivo: ");
  Serial.println(chipId);
  Serial.print("Nombre del dispositivo: ");
  Serial.println(deviceName);
  Serial.print("Ubicación: ");
  Serial.println(location);
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    if (WiFi.status() == WL_CONNECTED) {
      // Leer sensores
      float temperatura = dht.readTemperature();
      float humedad = dht.readHumidity();
      int doorState = digitalRead(DOOR_SENSOR_PIN);  // HIGH = abierto, LOW = cerrado
      
      // Verificar lecturas válidas
      if (!isnan(temperatura) && !isnan(humedad)) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        // Preparar JSON
        StaticJsonDocument<300> doc;
        doc["temperatura"] = temperatura;
        doc["humedad"] = humedad;
        doc["puerta"] = doorState == HIGH ? 1 : 0;  // Convertir a 1/0
        doc["id"] = String(chipId);
        doc["deviceName"] = deviceName;
        doc["location"] = location;
        
        String jsonString;
        serializeJson(doc, jsonString);
        
        // Mostrar datos en Serial
        Serial.println("\nEnviando datos:");
        Serial.printf("Temperatura: %.2f°C\n", temperatura);
        Serial.printf("Humedad: %.2f%%\n", humedad);
        Serial.printf("Puerta: %s\n", doorState == HIGH ? "Abierta" : "Cerrada");
        Serial.println("JSON: " + jsonString);
        
        // Enviar datos
        int httpResponseCode = http.POST(jsonString);
        
        if (httpResponseCode > 0) {
          Serial.printf("HTTP Response code: %d\n", httpResponseCode);
        } else {
          Serial.printf("Error code: %d\n", httpResponseCode);
        }
        
        http.end();
      } else {
        Serial.println("Error leyendo el sensor DHT");
      }
    } else {
      Serial.println("Error de conexión WiFi");
    }
  }
}