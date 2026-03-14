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
        const payload = {
            sourceIP: generateRandomIP(),
            destinationPort: commonPorts[Math.floor(Math.random() * commonPorts.length)],
            protocol: protocols[Math.floor(Math.random() * protocols.length)],
            packetSize: Math.floor(Math.random() * 1500) + 40, // 40 to 1540 bytes
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
