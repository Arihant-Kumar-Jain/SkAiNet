# SkyNet  
*A Decentralized Offline Mesh Network for Emergency & Strategic Communication*

---

## Overview
SkyNet is a **portable, decentralized mesh communication system** designed for use during **disasters, network blackouts, and strategic field operations**.  
When mobile towers or the internet fail, SkyNet enables reliable **text and location sharing** through small, battery-powered devices (nodes) that form a **self-healing LoRa mesh network**.  

Each node provides:
- **Long-range LoRa communication** (2–4 km per hop, extendable via multi-hop relays)  
- **Wi-Fi access point** for nearby users  
- **Offline web app** to send/receive text messages and GPS locations  
- **Rugged, battery-powered hardware** built for field conditions  

This makes SkyNet a **low-cost (~₹50,000), scalable, and resilient solution** for emergency responders, defense units, and remote communities.

---

## Problem
Disasters, cyber-attacks, or infrastructure failures often cause **complete communication blackouts**. Without connectivity:
- Rescue coordination becomes delayed.  
- Civilians are unable to share status or request help.  
- Remote regions and border areas remain cut off.  

Existing solutions like Bluetooth mesh apps (FireChat, Bridgefy) or LoRaWAN require central infrastructure and have **limited range or dependency issues**.  
SkyNet bridges this gap by combining **LoRa radios + offline Wi-Fi UI**, ensuring communication works **completely off-grid**.

---

## Objectives
- **Portable Mesh Nodes:** Build 3–5 ESP32 + LoRa + GPS + optional GSM units.  
- **Long-Range Communication:** 2–4 km per hop with multi-hop expansion.  
- **Store-and-Forward Messaging:** Reliable delivery even with intermittent connectivity.  
- **Offline Web Interface:** Browser-based UI for texts and GPS sharing, no internet required.  
- **Sustainable Power:** Nodes last several days on a single charge.  
- **Budget Efficiency:** Complete system within ₹50,000.  

---

## Technical Design
- **Hardware:** ESP32-based LoRa board (Heltec WiFi LoRa 32 V3), Li-Po batteries, rugged enclosure.  
- **Software:**
  - **Messaging Layer:** LoRa-based peer-to-peer protocol with store-and-forward reliability.  
  - **User Interface:** Minimalist offline web app hosted on ESP32’s Wi-Fi AP.  
- **Architecture:** Fully decentralized mesh; each node acts as both **user access point** and **LoRa relay**.  
- **Scalability:** New nodes can be added seamlessly without reconfiguration.  

---

## Expected Deliverables
- **Working Mesh Network:** Multi-hop messaging across 3+ nodes.  
- **Offline Web App:** Mobile-friendly UI for messaging and GPS sharing.  
- **Prototype Hardware:** Rugged nodes with labeled ports, ready for demo.  
- **Documentation:** Circuit diagrams, CAD designs, source code, and usage guide.  
- **Performance Data:** Range tests, power consumption results, and mesh reliability reports.  

---

## Testing & Evaluation
1. **Range & Coverage:** Measure single-hop and multi-hop performance.  
2. **Mesh Reliability:** Simulate node failures, evaluate rerouting.  
3. **Load Handling:** Test message delivery under heavy usage.  
4. **Power Endurance:** Continuous operation testing for multi-day use.  
5. **User Feedback:** Usability trials of offline web interface.  

---

## Challenges & Mitigation
- **Limited Bandwidth:** Prioritize short messages; restrict large files.  
- **LoRa Duty Cycles:** Use efficient acknowledgment & backoff strategies.  
- **Scalability Issues:** Introduce randomized delays to reduce collisions.  
- **Power Dependency:** Enable low-power modes, plan for solar charging.  
- **Ease of Use:** Design an intuitive, no-login UI with quick-start guide.  

---

## Future Scope
- **Drone-Assisted Mesh Expansion** for aerial coverage in remote/disaster zones.  
- **Integration with Cellular/Satellite Gateways** for hybrid networks.  
- **Applications in Agriculture, Defense, Rural Connectivity, and IoT.**  
- **Enhanced Security & Encryption** for sensitive communication.  
- **Global Scale:** Interfacing with satellite constellations for planetary coverage.  

---

## Conclusion
SkyNet demonstrates how **student-driven innovation** can provide real-world impact in disaster management and strategic communication.  
By combining **LoRa’s long-range resilience** with a **user-friendly offline web interface**, SkyNet creates a reliable, portable, and low-cost communication system for critical situations.  

---

## Team Members
- **Akshat Mittal**  
- **Arihant Kumar Jain**  
- **Vansh Pandey**  
- **Rohit**  
- **Ujjwal Singh**  
- **Ayush Gupta**  
