import pino from 'pino';
import path from 'path';

// Define log file path
const logFilePath = path.join(process.cwd(), 'logs', 'audit.log');

// Create Pino logger that writes to a file
const auditLogger = pino({
    level: 'info',
    transport: {
        target: 'pino/file',
        options: { destination: logFilePath }
    }
});

// Function to log audit events
export const logAuditEvent = (userId, action, targetTable, targetId, ipAddress, result, details) => {
    auditLogger.info({
        timestamp: new Date().toISOString(),
        user_id: userId || "Anonymous",
        action: action,
        target_table: targetTable,
        target_id: targetId || "N/A",
        ip_address: ipAddress || "Unknown",
        result: result,
        details: details || "No details provided"
    });
};
