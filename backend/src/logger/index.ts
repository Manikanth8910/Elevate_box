export class Logger {
  static info(message: string, context?: any) {
    console.log(JSON.stringify({ level: 'INFO', message, ...context, timestamp: new Date().toISOString() }));
  }

  static error(name: string, message: string, context?: any) {
    console.error(JSON.stringify({ level: 'ERROR', name, message, ...context, timestamp: new Date().toISOString() }));
  }

  static warn(message: string, context?: any) {
    console.warn(JSON.stringify({ level: 'WARN', message, ...context, timestamp: new Date().toISOString() }));
  }
}

export class AuditLogger {
  static log(context: any) {
    Logger.info('AUDIT_EVENT', context);
  }
}

export class SecurityLogger {
  static log(context: any) {
    Logger.warn('SECURITY_EVENT', context);
  }
}
