#include "HT_TinyGPS++.h"
#include <HardwareSerial.h>
#include <Wire.h>
#include "HT_SSD1306Wire.h"

TinyGPSPlus gps;
HardwareSerial gpsSerial(1);

// --- OLED ---
static SSD1306Wire display(0x3c, 500000, SDA_OLED, SCL_OLED, GEOMETRY_128_64, RST_OLED);

void VextON(void) {
  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW);
}

void showOLED(String l1, String l2 = "", String l3 = "", String l4 = "") {
  display.clear();
  display.setFont(ArialMT_Plain_10);
  display.setTextAlignment(TEXT_ALIGN_LEFT);
  if (l1 != "") display.drawString(0, 0, l1);
  if (l2 != "") display.drawString(0, 16, l2);
  if (l3 != "") display.drawString(0, 32, l3);
  if (l4 != "") display.drawString(0, 48, l4);
  display.display();
}

void setup() {
  Serial.begin(115200);
  
  // Turn on Vext power for peripherals
  VextON();
  delay(100);
  
  // Initialize OLED
  display.init();
  display.setFont(ArialMT_Plain_10);
  display.setTextAlignment(TEXT_ALIGN_LEFT);
  
  // Initialize GPS Serial (RX=GPIO45, TX=GPIO46 for ESP32-S3)
  gpsSerial.begin(9600, SERIAL_8N1, 45, 46);
  
  showOLED("GPS Test Started");
  Serial.println("GPS Test Started");
  delay(2000);
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  if (gps.location.isValid() && gps.location.isUpdated()) {
    showOLED("Coordinates", 
             "Lat: " + String(gps.location.lat(), 6), 
             "Lng: " + String(gps.location.lng(), 6), 
             "Sats: " + String(gps.satellites.value()));

    Serial.print("Latitude: ");
    Serial.println(gps.location.lat(), 6);
    Serial.print("Longitude: ");
    Serial.println(gps.location.lng(), 6);
    Serial.print("Satellites: ");
    Serial.println(gps.satellites.value());
    Serial.println("-----");
  } else {
    Serial.println("GPS data not available (no fix yet)");
    showOLED("Waiting for GPS...", "Satellites: " + String(gps.satellites.value()));
  }

  delay(2000);
}