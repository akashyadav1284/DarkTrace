const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000/api/traffic/send';

const getRandomIP = () => {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

const getRandomPort = () => {
    const ports = [80, 443, 22, 53, 21, 3306, 8080, 4444, 1337];
    return ports[Math.floor(Math.random() * ports.length)];
};

const getRandomProtocol = () => {
    const protocols = ['TCP', 'UDP', 'ICMP'];
    return protocols[Math.floor(Math.random() * protocols.length)];
};

const sendPacket = async () => {
    // Generate mostly normal traffic, occasionally malicious
    const isMalicious = Math.random() < 0.1; // 10% chance of being malicious

    const packet = {
        sourceIP: getRandomIP(),
        destinationPort: isMalicious ? (Math.random() < 0.5 ? 4444 : 1337) : getRandomPort(),
        protocol: getRandomProtocol(),
        packetSize: isMalicious ? Math.floor(Math.random() * 10000) + 5000 : Math.floor(Math.random() * 1500) + 40,
    };

    try {
        await axios.post(BACKEND_URL, packet);
        console.log(`Sent: ${packet.sourceIP} | Port: ${packet.destinationPort} | Size: ${packet.packetSize} B`);
    } catch (err) {
        if (err.response?.status === 403) {
            console.log(`Blocked connection dropped for ${packet.sourceIP}`);
        } else {
            console.log('Error sending to backend (Is the backend running?)');
        }
    }
};

console.log("Starting Traffic Simulation (Ctrl+C to stop)...");

// Send a packet every 1-3 seconds
setInterval(() => {
    sendPacket();
}, Math.floor(Math.random() * 2000) + 1000);
