const fs = require('fs');
const path = require('path');

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            let c = fs.readFileSync(p, 'utf8');
            
            // Fix string interpolation error. The previous replacements injected `...'/api/...', where there was a backtick to start but no backtick to end.
            
            // For axios calls
            c = c.replace(/await axios\.([a-z]+)\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \(process\.env\.NEXT_PUBLIC_API_URL \|\| process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5000'\)\}\/api/g, "await axios.$1(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api");
            
            // Specifically handling login/register and standard endpoints where the closing ' is missing
            c = c.replace(/\/api\/([^']+)',/g, "/api/$1`,");
            c = c.replace(/\/api\/([^']+)'\)/g, "/api/$1`)");

            // Fix the io connections
            c = c.replace(/const socket = io\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \(process\.env\.NEXT_PUBLIC_API_URL \|\| process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5000'\)\}'\);/g, "const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');");
            c = c.replace(/const socket = io\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \(process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5000'\)\}`\);/g, "const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');");
            
            // Clean up general axios calls
            c = c.replace(/await axios\.([a-z]+)\(`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \(process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5000'\)\}\/api/g, "await axios.$1(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api");
            
            // Extreme clean up
            c = c.replace(/`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| \(process\.env\.NEXT_PUBLIC_API_URL \|\| process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5000'\)\}/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}")

            fs.writeFileSync(p, c);
        }
    }
}
walk(path.join(__dirname, 'frontend/src'));
console.log('Fixed quotes properly');
