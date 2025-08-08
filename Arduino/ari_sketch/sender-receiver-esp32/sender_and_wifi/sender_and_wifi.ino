#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <DNSServer.h>
#include <esp_now.h>

// Wi-Fi credentials
const char* ssid = "SKYNET";
const char* password = "";

AsyncWebServer server(80);
DNSServer dnsServer;
const byte DNS_PORT = 53;

// Structure for ESP-NOW data
typedef struct struct_message {
  char msg[150];
} struct_message;

struct_message dataToSend;

// For ESP-NOW timing
bool shouldBroadcast = false;
unsigned long startTime;
const unsigned long duration = 10000;  // 10 seconds

// Broadcast address
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// HTML Page
String htmlPage = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <title>Help Form</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial; text-align: center; margin-top: 50px; }
    input, textarea {
      width: 90%%; max-width: 400px; padding: 10px; margin: 10px; border-radius: 5px; border: 1px solid #ccc;
    }
    button {
      padding: 10px 20px; background-color: #28a745; color: white;
      border: none; border-radius: 5px; cursor: pointer;
    }
    .counter { font-size: 14px; color: gray; }
  </style>
</head>
<body>
  <h2>Flood Survivor Assistance</h2>
  <form action="/submit" method="GET">
    <input type="text" name="name" placeholder="Your Name" required><br>
    <textarea name="message" maxlength="150" placeholder="Your Message" oninput="updateCounter(this)"></textarea>
    <div class="counter" id="charCount">0 / 150 characters</div>
    <br>
    <button type="submit">Submit</button>
  </form>
  <script>
    function updateCounter(textarea) {
      const counter = document.getElementById("charCount");
      counter.textContent = textarea.value.length + " / 150 characters";
    }
  </script>
</body>
</html>
)rawliteral";

// Initialize ESP-NOW
void initESPNow() {
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (!esp_now_is_peer_exist(broadcastAddress)) {
    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
      Serial.println("Failed to add ESP-NOW peer");
    }
  }
}

// Setup
void setup() {
  Serial.begin(115200);

  // Set up Wi-Fi Access Point
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid, password);
  delay(100);

  // Start DNS redirect
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  // Initialize ESP-NOW
  initESPNow();

  // Default route
  server.onNotFound([](AsyncWebServerRequest *request) {
    request->redirect("/");
  });

  // Serve homepage
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/html", htmlPage);
  });

  // Handle form submission
  server.on("/submit", HTTP_GET, [](AsyncWebServerRequest *request) {
    String name = "", message = "";

    if (request->hasParam("name")) name = request->getParam("name")->value();
    if (request->hasParam("message")) message = request->getParam("message")->value();

    Serial.println("---- Form Submission ----");
    Serial.println("Name: " + name);
    Serial.println("Message: " + message);
    Serial.println("-------------------------");

    // Prepare data
    String combined = "Name: " + name + ", Message: " + message;
    combined.toCharArray(dataToSend.msg, sizeof(dataToSend.msg));

    // Start broadcasting
    shouldBroadcast = true;
    startTime = millis();

    // Send web response
    String response = "<h2>Thank you, " + name + "!</h2><p>Your message is being broadcast.</p>";
    request->send(200, "text/html", response);
  });

  // Start web server
  server.begin();

  Serial.println("AP started. IP: ");
  Serial.println(WiFi.softAPIP());
}

void loop() {
  dnsServer.processNextRequest();

  if (shouldBroadcast) {
    if (millis() - startTime < duration) {
      esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *)&dataToSend, sizeof(dataToSend));
      if (result == ESP_OK) {
        Serial.println("ESP-NOW message broadcasted.");
      } else {
        Serial.println("ESP-NOW send failed.");
      }
      delay(200); // 5 times per second
    } else {
      Serial.println("Broadcast completed.");
      shouldBroadcast = false;
    }
  }
}
