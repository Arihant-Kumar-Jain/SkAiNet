void setup() {
  pinMode(2, OUTPUT); // GPIO 2 is typically the built-in LED
}

void loop() {
  digitalWrite(2, HIGH); // Turn LED on
  delay(500);            // Wait 500 ms
  digitalWrite(2, LOW);  // Turn LED off
  delay(500);            // Wait 500 ms
}
