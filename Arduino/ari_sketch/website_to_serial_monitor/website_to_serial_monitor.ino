#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "Arihant_iphone";
const char* password = "ari123hant";

WebServer server(80);

// HTML form page
const char* htmlForm = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <title>Flood Survivor Form</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #f2f2f2;
    }
    h2 {
      color: #333;
    }
    input, textarea {
      width: 100%;
      padding: 10px;
      margin-top: 8px;
      margin-bottom: 15px;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: vertical;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 25px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #charCount {
      font-size: 0.9em;
      color: #666;
      text-align: right;
    }
  </style>
</head>
<body>

  <h2>Flood Survivor Form</h2>
  <form action="/submit" method="POST">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>

    <label for="message">Message:</label>
    <textarea id="message" name="message" maxlength="150" rows="5" required></textarea>
    <div id="charCount">0/150</div>

    <button type="submit">Send</button>
  </form>

  <script>
    const messageInput = document.getElementById("message");
    const charCount = document.getElementById("charCount");

    messageInput.addEventListener("input", () => {
      charCount.textContent = `${messageInput.value.length}/150`;
    });
  </script>

</body>
</html>
)rawliteral";

void handleRoot() {
  server.send(200, "text/html", htmlForm);
}

void handleSubmit() {
  if (server.method() == HTTP_POST) {
    String name = server.arg("name");
    String message = server.arg("message");

    Serial.println("---- Survivor Message Received ----");
    Serial.println("Name: " + name);
    Serial.println("Message: " + message);
    Serial.println("-----------------------------------");

    server.send(200, "text/html", "<h2>Thank you, your message has been received.</h2>");
  } else {
    server.send(405, "text/plain", "Method Not Allowed");
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi");
  Serial.println("IP address: " + WiFi.localIP().toString());

  server.on("/", handleRoot);
  server.on("/submit", HTTP_POST, handleSubmit);

  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}
