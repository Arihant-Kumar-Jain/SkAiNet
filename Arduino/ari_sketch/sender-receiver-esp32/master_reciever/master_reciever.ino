#include <WiFi.h>
#include <esp_now.h>

// Callback when data is received
void onReceive(const esp_now_recv_info_t *info, const uint8_t *incomingData, int len) {
  char msg[len + 1];
  memcpy(msg, incomingData, len);
  msg[len] = '\0';

  Serial.print("From MAC: ");
  for (int i = 0; i < 6; i++) {
    Serial.print(info->src_addr[i], HEX);
    if (i < 5) Serial.print(":");
  }

  Serial.print(" | Message: ");
  Serial.println(msg);
}

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  // ✅ Updated callback registration
  esp_now_register_recv_cb(onReceive);
}

void loop() {
  // Nothing needed here
}
