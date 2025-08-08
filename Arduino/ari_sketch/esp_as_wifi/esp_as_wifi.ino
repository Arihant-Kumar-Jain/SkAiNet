#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <DNSServer.h>

const char* ssid = "SKYNET";
const char* password = "";

AsyncWebServer server(80);
DNSServer dnsServer;

const byte DNS_PORT = 53;

// HTML Form Page
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

void setup() {
  Serial.begin(115200);

  // Set up ESP32 as Access Point
  WiFi.softAP(ssid, password);
  delay(100);

  // Start DNS server to redirect all domains to ESP IP
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  // Redirect all unknown paths to "/"
  server.onNotFound([](AsyncWebServerRequest *request){
    request->redirect("/");
  });

  // Serve main form
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/html", htmlPage);
  });

  // Handle form submission
  server.on("/submit", HTTP_GET, [](AsyncWebServerRequest *request){
    String name = "", message = "";

    if (request->hasParam("name")) {
      name = request->getParam("name")->value();
    }
    if (request->hasParam("message")) {
      message = request->getParam("message")->value();
    }

    Serial.println("---- Form Submission ----");
    Serial.println("Name: " + name);
    Serial.println("Message: " + message);
    Serial.println("-------------------------");

    String response = "<h2>Thank you, " + name + "!</h2><p>Your message has been received.</p>";
    request->send(200, "text/html", response);
  });

  server.begin();
  Serial.println("Portal ready at: ");
  Serial.println(WiFi.softAPIP());
} 

void loop() {
  dnsServer.processNextRequest();  // Handle DNS requests
}
