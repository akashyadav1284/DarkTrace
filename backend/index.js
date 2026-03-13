const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./db');
let Tail;
try {
    const tailModule = require('tail');
    Tail = tailModule.Tail;
} catch (e) {
    console.warn("tail module not found. Falling back to fs.watch polling.");
    Tail = null;
}
const fs = require('fs');
const path = require('path');
const IdsAlert = require('./models/IdsAlert');

dotenv.config();

// Connect to MongoDB
// Note: We need a valid MONGO_URI in the environment. For local testing without one, comment out the line below.
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(express.json());
app.use(cors());

// Make io accessible to our router
app.use((req, res, next) => {
    req.io = io;
    next();
});

const authRoutes = require('./routes/auth');
const trafficRoutes = require('./routes/traffic');
const adminRoutes = require('./routes/admin');
const threatRoutes = require('./routes/threat');
const intelligenceRoutes = require('./routes/intelligence');
const healthRoutes = require('./routes/health');
const idsRoutes = require('./routes/ids');

app.use('/api/auth', authRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/threat', threatRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ids', idsRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Start Tailing Snort Logs
const snortLogPath = path.join(__dirname, 'logs', 'snort.log');
// Make sure log directory exists to avoid crash on startup before simulator runs
if (!fs.existsSync(path.dirname(snortLogPath))) {
    fs.mkdirSync(path.dirname(snortLogPath), { recursive: true });
}
if (!fs.existsSync(snortLogPath)) {
    fs.writeFileSync(snortLogPath, '');
}

const parseIDSLine = async (data) => {
    try {
        const match = data.match(/\[\*\*\] \[\d+:(\d+):\d+\] (.*?) \[\*\*\] .*? \[Priority: (\d+)\] \{\w+\} ([\d\.]+)[:\d]* -> ([\d\.]+)[:\d]*/);
        if (match) {
            console.log("Regex matched a log line!");
            const [_, signatureId, msg, priority, sourceIP, destinationIP] = match;
            
            let severity = 'Low';
            if (priority === '1') severity = 'Critical';
            else if (priority === '2') severity = 'High';
            else if (priority === '3') severity = 'Medium';

            const alert = await IdsAlert.create({
                sourceIP,
                destinationIP,
                attackType: 'Intrusion Detection',
                signatureId,
                severity,
                message: msg.trim()
            });

            // Convert to explicit plain object before sending over WebSocket to avoid cyclic serialization crashes
            io.emit('new_ids_alert', alert.toObject());
        }
    } catch (error) {
        console.error('Error parsing IDS log line:', error);
    }
};

if (Tail) {
    const tail = new Tail(snortLogPath);
    tail.on('line', parseIDSLine);
    tail.on('error', (error) => {
        console.log('Tail error:', error);
    });
} else {
    // Fallback using native fs.watch
    let lastSize = fs.statSync(snortLogPath).size;
    fs.watch(snortLogPath, (eventType) => {
        if (eventType === 'change') {
            const stats = fs.statSync(snortLogPath);
            if (stats.size > lastSize) {
                const stream = fs.createReadStream(snortLogPath, { start: lastSize, end: stats.size });
                let buffer = '';
                stream.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // keep last incomplete line
                    lines.forEach(line => {
                        if (line.trim()) parseIDSLine(line);
                    });
                });
                lastSize = stats.size;
            } else if (stats.size < lastSize) {
                lastSize = stats.size; // Handle file truncation
            }
        }
    });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
