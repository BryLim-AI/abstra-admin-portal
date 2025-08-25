import fs from 'fs';
import path from 'path';

export default function getAuditLogs(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const logFilePath = path.join(process.cwd(), 'logs', 'audit.log');
// For real time audit log this is different from act. logs
    try {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        const logStream = fs.createReadStream(logFilePath, { encoding: 'utf8' });
        logStream.pipe(res);

        logStream.on('error', (err) => {
            console.error("Error reading log file:", err);
            res.status(500).json({ message: "Error reading logs" });
        });

    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
