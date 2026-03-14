const axios = require('axios');

const PORT = process.env.PORT || 10000;
// Note: If calling from inside the exact same Render server, we can use localhost
const API_URL = `http://127.0.0.1:${PORT}/api/traffic/send`;

const protocols = ['TCP', 'UDP', 'ICMP'];
const commonPorts = [80, 443, 22, 21, 3306, 5432, 27017, 8080];

function generateRandomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function sendFakeTraffic() {
    try {
        const protocols = ['TCP', 'UDP', 'ICMP'];
        const commonPorts = [80, 443, 22, 21, 3306, 5432, 27017, 8080];
        const threatPorts = [23, 25, 445, 3389]; // Known vulnerable/attacker ports
        
        // 15% chance of a massive DDoS packet, 20% chance of a suspicious terminal scan
        const isMalicious = Math.random() < 0.15;
        const isSuspicious = !isMalicious && Math.random() < 0.20;

        let port = commonPorts[Math.floor(Math.random() * commonPorts.length)];
        let size = Math.floor(Math.random() * 1500) + 40; // Normal bytes

        if (isMalicious) {
            size = Math.floor(Math.random() * 10000) + 5000; // Trigger "Malicious" ML Rule (packet > 5000)
        } else if (isSuspicious) {
            port = threatPorts[Math.floor(Math.random() * threatPorts.length)]; // Trigger "Suspicious" ML Rule
        }

        const payload = {
            sourceIP: generateRandomIP(),
            destinationPort: port,
            protocol: protocols[Math.floor(Math.random() * protocols.length)],
            packetSize: size,
        };

        await axios.post(API_URL, payload);
        console.log(`[Simulator] Generated Traffic: ${payload.protocol} packet from ${payload.sourceIP} to port ${payload.destinationPort}`);
    } catch (err) {
        console.error(`[Simulator Error] Failed to send packet: ${err.message}`);
    }
}

// Generate a random packet every 1-4 seconds
setInterval(sendFakeTraffic, Math.floor(Math.random() * 3000) + 1000);

console.log(`Traffic Simulator started. Sending data to ${API_URL}`);
