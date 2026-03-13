# Aegis.SOC - Enterprise Network Threat Detection and Response System

## Overview
A web-based platform that monitors incoming network traffic in real time, detects suspicious activities using machine learning, visualizes threats globally, and provides automated incident response capabilities. The system mimics a high-tech enterprise SOC (Security Operation Center) dashboard natively integrated with OS-level firewall rules and intrusion detection systems.

## Tech Stack
- **Frontend:** Next.js (React), Tailwind CSS, Framer Motion, Recharts, React-Simple-Maps, Socket.io Client
- **Backend:** Node.js, Express.js, Socket.io Server, Mongoose, geoip-lite, tail
- **Database:** MongoDB Atlas
- **ML Microservice:** Python, Flask, Scikit-learn (Isolation Forest & Random Forest Regressor)
- **Integrations:** Windows `netsh advfirewall` (Auto-Blocking), Snort IDS (Simulated Logs via file tailing)

## Enterprise Features Added (Phase 2 Upgrade)
- **🌍 Global Cyber Attack Map:** Live attacker tracking with `geoip-lite` precision coordinates and targeted routing animations.
- **🧠 AI Threat Prediction Forecasting:** A Random Forest model projecting probability of future network threats over a 24-hour timeline.
- **🛡️ IDS / IPS Sensor Streams:** Live tailing of simulated backend `snort.log` files mapping standard signature formats over WebSockets.
- **💻 Hacker-Style Threat Console:** Color-coded streaming terminal UI that hooks into both live packets and raw IDS triggers.
- **🧱 OS-Level Firewall Auto-Blocking:** When critical threats strike, Node spawns a `child_process` sending a `netsh advfirewall` command to physically block the attacking IP from the host machine.
- **🔄 Interactive SOC Workflow:** A glowing pipeline illustrating packet flow through the ML engine, to IDS, to the incident log.
- **📊 Advanced Security Analytics:** Threat severity pie charts, Top targeted ports bars, and a Subnet destination scatter-plot heatmap.
- **🌐 Threat Intelligence API:** Real-time simulations of IP reputation lookups.

## Project Structure
- `/frontend`: Next.js immersive UI dashboard application.
- `/backend`: Node.js Express server to handle APIs, WebSocket connections, GeoIP parsing, OS Firewall interaction, and IDS tailing.
- `/ml-service`: Python Flask API running the Machine Learning anomaly detection and predictive trend models.

## Setup Instructions

### 1. Global Start (Recommended)
You can start all 3 main services at once utilizing concurrently from the root directory:
```bash
npm install
npm run start:all
```
*(Ensure Python `venv` is active and Next.js/Node/Flask are running on their default `.env` ports)*

### 2. Live IDS / Traffic Simulation
To feed packets and Snort logs to the system, open a separate terminal and run:
```bash
npm run simulate
```

### Note on Auto-Firewall Blocking
To allow the node application to successfully inject `netsh` firewall rules during a Critical-level threat, the terminal running `npm run start:backend` (or `npm run start:all`) **must be launched with Administrator Privileges**.

## Key Sections
- **Live Traffic:** Monitor all inbound connections via WebSocket.
- **Threat Logs:** Review historical logs saved heavily in MongoDB.
- **Blocked IPs:** Manually block or unblock IPs, seamlessly synced with the host Windows OS.
- **ML Insights:** Keep track of Python algorithm precision and recent anomaly events.
- **Threat Console:** Typewriter-style stream for deep packet investigation.
- **IDS Sensors:** Granular inspection of Snort/Suricata triggers.
