#include <WiFi.h>
#include <PubSubClient.h>
#include "esp_camera.h"
#include <Base64.h> 
#include "time.h"

const char* ssid = "Vieri Firdaus";  
const char* password = "asdfghjkl";  

const char* mqtt_server = "212.85.26.216";  
const char* mqtt_user = "vierifirdaus";  
const char* mqtt_pass = "qwerty";  
const char* mqtt_topic_image = "iot/image";  
const char* mqtt_topic_latency = "iot/latency";  
int range = 10;
int freq = 10;

int counter = 0;
int success = 0;
int failed = 0;

int message_id = 4501;

unsigned long start_time, end_time;  
unsigned long capture_time;
unsigned long publish_time;

const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 3600;
const int   daylightOffset_sec = 3600;

WiFiClient espClient;
PubSubClient client(espClient);

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

unsigned long previousMillis = 0;   
const int timerInterval = 10*1000;    
String getFormattedTime() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("Failed to obtain time");
    return "";
  }
  
  char timeString[30];
  strftime(timeString, sizeof(timeString), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timeString);
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected to WiFi with IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  configTime(3600, 3600, "pool.ntp.org");
  client.setServer(mqtt_server, 1883);
  
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // init with high specs to pre-allocate larger buffers
  if(psramFound()){
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;  //0-63 lower number means higher quality
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_CIF;
    config.jpeg_quality = 12;  //0-63 lower number means higher quality
    config.fb_count = 1;
  }
  
  // camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    delay(1000);
    ESP.restart();
  }
}

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= timerInterval && counter < range) {
    counter++;
    sendPhoto();
    previousMillis = currentMillis;

    message_id++;
  }
}

void sendPhoto() {
  camera_fb_t * fb = NULL;
  start_time = millis();
  fb = esp_camera_fb_get();
  if(!fb) {
    Serial.println("Camera capture failed");
    delay(1000);
    ESP.restart();
  }
  end_time = millis();
  capture_time = end_time - start_time;

  Serial.println("Connecting to MQTT server...");

  if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
    Serial.println("Connected to MQTT server");

    String base64Image = base64::encode(fb->buf, fb->len);
    
    Serial.println(getFormattedTime());
    String payloadImage = "{\"id\":" + String(message_id) + 
                      ",\"image\":\"" + base64Image + "\"" +
                      ",\"timestamp\":\"" + getFormattedTime() + "\"}";
    start_time = millis();
    client.publish(mqtt_topic_image, payloadImage.c_str());
    end_time = millis();

    publish_time = end_time - start_time;
    
    String payloadLatency = "{\"id\":" + String(message_id) + 
                          ",\"capture_time\":" + String(capture_time) + 
                          ",\"publish_time\":" + String(publish_time) +"}";
    client.publish(mqtt_topic_latency, payloadLatency.c_str());

    Serial.println("Image sent to MQTT topic.");

    esp_camera_fb_return(fb);  
    success++;
  } else {
    failed++;
    Serial.println("Failed to connect to MQTT broker.");
  }
  int total = success+failed;
  if(total > 0) {

    float successRate = (success / float(total)) * 100;
    Serial.print("Success Rate: ");
    Serial.print(successRate);
    Serial.print("%");
    Serial.print("(");
    Serial.print(success);
    Serial.print("/");
    Serial.print(total);
    Serial.println(")");
  }

  client.loop(); 
}