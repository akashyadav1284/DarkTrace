const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs/snort.log');

// Ensure log directory exists
if (!fs.existsSync(path.dirname(logFile))) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

// Ensure log file exists
if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
}

const signatures = [
    { msg: "Possible SQL Injection", sid: "1000001", severity: "High" },
    { msg: "ET SCAN Nmap OS Detection Probe", sid: "2000537", severity: "Medium" },
    { msg: "GPL EXPLOIT CodeRed v2 root.exe access", sid: "2100428", severity: "Critical" },
    { msg: "MALWARE-CNC Win.Trojan.Zeus variant outbound connection", sid: "3000123", severity: "Critical" },
    { msg: "ICMP PING NMAP", sid: "4000111", severity: "Low" }
];

function generateRandomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function writeLog() {
    const timestamp = new Date().toLocaleString('en-US', { hour12: false });
    const sig = signatures[Math.floor(Math.random() * signatures.length)];
    const srcIP = generateRandomIP();
    const dstIP = "10.0.0.5"; // Internal network IP
    const srcPort = Math.floor(Math.random() * 60000) + 1024;
    const dstPort = [80, 443, 22, 3306, 8080][Math.floor(Math.random() * 5)];

    // Snort alert format: [**] [1:1000001:1] Possible SQL Injection [**] [Classification: Web Application Attack] [Priority: 1] {TCP} 192.168.1.1:1234 -> 10.0.0.5:80
    const logLine = `[**] [1:${sig.sid}:1] ${sig.msg} [**] [Classification: Attempted Information Leak] [Priority: ${sig.severity === 'Critical' ? 1 : 2}] {TCP} ${srcIP}:${srcPort} -> ${dstIP}:${dstPort}\n`;

    fs.appendFileSync(logFile, logLine);
    console.log(`Generated Snort Alert: ${sig.msg} from ${srcIP}`);
}

// Generate an alert every 3 to 5 seconds for visual testing
setInterval(writeLog, Math.floor(Math.random() * 2000) + 3000);

console.log('Snort IDS Simulator started. Logging to:', logFile);
