import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  event: string;
  userId?: string;
  data?: any;
  error?: string;
  stack?: string;
  ip?: string;
  userAgent?: string;
}

class LoggingService {
  private logDir: string;
  private logFile: string;
  private errorLogFile: string;
  private criticalLogFile: string;

  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = path.join(this.logDir, 'app.log');
    this.errorLogFile = path.join(this.logDir, 'errors.log');
    this.criticalLogFile = path.join(this.logDir, 'critical.log');

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log general information
   */
  logInfo(event: string, data?: any, userId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      event,
      userId,
      data
    });
  }

  /**
   * Log warning
   */
  logWarning(event: string, data?: any, userId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      event,
      userId,
      data
    });
  }

  /**
   * Log error
   */
  logError(event: string, error?: Error, data?: any, userId?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      event,
      userId,
      data,
      error: error?.message,
      stack: error?.stack
    };

    this.writeLog(logEntry);
    this.writeErrorLog(logEntry);
  }

  /**
   * Log critical error (also sends alert)
   */
  logCritical(event: string, error?: Error, data?: any, userId?: string) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'critical',
      event,
      userId,
      data,
      error: error?.message,
      stack: error?.stack
    };

    this.writeLog(logEntry);
    this.writeErrorLog(logEntry);
    this.writeCriticalLog(logEntry);

    // Send alert notification
    this.sendAlert(logEntry);
  }

  /**
   * Log payment events
   */
  logPaymentEvent(event: string, data: any) {
    this.logInfo(`payment_${event}`, data, data.userId);
  }

  /**
   * Log referral events
   */
  logReferralEvent(event: string, data: any) {
    this.logInfo(`referral_${event}`, data, data.userId);
  }

  /**
   * Log tournament events
   */
  logTournamentEvent(event: string, data: any) {
    this.logInfo(`tournament_${event}`, data, data.userId);
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, data: any, userId?: string) {
    this.logWarning(`security_${event}`, data, userId);
  }

  /**
   * Write to main log file
   */
  private writeLog(entry: LogEntry) {
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
  }

  /**
   * Write to error log file
   */
  private writeErrorLog(entry: LogEntry) {
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.errorLogFile, logLine);
  }

  /**
   * Write to critical log file
   */
  private writeCriticalLog(entry: LogEntry) {
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.criticalLogFile, logLine);
  }

  /**
   * Send alert for critical errors
   */
  private sendAlert(entry: LogEntry) {
    try {
      // Send to Telegram admin
      if (process.env.ADMIN_TELEGRAM_CHAT_ID && process.env.TELEGRAM_BOT_TOKEN) {
        const message = `🚨 CRITICAL ERROR\n\n` +
          `Event: ${entry.event}\n` +
          `Error: ${entry.error}\n` +
          `User: ${entry.userId || 'N/A'}\n` +
          `Time: ${entry.timestamp}\n` +
          `Data: ${JSON.stringify(entry.data, null, 2)}`;

        // TODO: Implement Telegram alert
        console.log('ALERT:', message);
      }

      // Send email alert
      if (process.env.ADMIN_EMAIL) {
        // TODO: Implement email alert
        console.log(`ALERT EMAIL sent to ${process.env.ADMIN_EMAIL}: ${entry.event}`);
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100, level?: string): LogEntry[] {
    try {
      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      let logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(log => log !== null) as LogEntry[];

      if (level) {
        logs = logs.filter(log => log.level === level);
      }

      return logs.slice(-count);
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeframe: number = 24): any {
    try {
      const content = fs.readFileSync(this.errorLogFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line);
      
      const logs = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(log => log !== null) as LogEntry[];

      const cutoff = new Date(Date.now() - timeframe * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoff);

      const stats = {
        totalErrors: recentLogs.length,
        criticalErrors: recentLogs.filter(log => log.level === 'critical').length,
        errorsByEvent: {} as Record<string, number>,
        errorsByHour: {} as Record<string, number>
      };

      recentLogs.forEach(log => {
        // Count by event
        stats.errorsByEvent[log.event] = (stats.errorsByEvent[log.event] || 0) + 1;

        // Count by hour
        const hour = new Date(log.timestamp).getHours();
        stats.errorsByHour[hour] = (stats.errorsByHour[hour] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return null;
    }
  }

  /**
   * Clean old logs
   */
  cleanupLogs(daysToKeep: number = 7) {
    try {
      const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      [this.logFile, this.errorLogFile, this.criticalLogFile].forEach(file => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.trim().split('\n').filter(line => line);
          
          const recentLines = lines.filter(line => {
            try {
              const log = JSON.parse(line);
              return new Date(log.timestamp) > cutoff;
            } catch {
              return false;
            }
          });

          fs.writeFileSync(file, recentLines.join('\n') + '\n');
        }
      });
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }
  }
}

// Export singleton instance
export const loggingService = new LoggingService();

// Export convenience functions
export const logInfo = (event: string, data?: any, userId?: string) => 
  loggingService.logInfo(event, data, userId);

export const logWarning = (event: string, data?: any, userId?: string) => 
  loggingService.logWarning(event, data, userId);

export const logError = (event: string, error?: Error, data?: any, userId?: string) => 
  loggingService.logError(event, error, data, userId);

export const logCritical = (event: string, error?: Error, data?: any, userId?: string) => 
  loggingService.logCritical(event, error, data, userId);

export const logPaymentEvent = (event: string, data: any) => 
  loggingService.logPaymentEvent(event, data);

export const logReferralEvent = (event: string, data: any) => 
  loggingService.logReferralEvent(event, data);

export const logTournamentEvent = (event: string, data: any) => 
  loggingService.logTournamentEvent(event, data);

export const logSecurityEvent = (event: string, data: any, userId?: string) => 
  loggingService.logSecurityEvent(event, data, userId);

export default loggingService;
