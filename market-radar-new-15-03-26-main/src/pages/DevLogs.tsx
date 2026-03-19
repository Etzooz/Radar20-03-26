import { useState, useEffect } from "react";
import { devLogger } from "@/lib/devLogger";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DevLogs = () => {
  const [logs, setLogs] = useState(devLogger.logs);

  useEffect(() => {
    const i = setInterval(() => {
      setLogs([...devLogger.logs]);
    }, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="p-4 bg-background text-bullish min-h-screen text-xs font-mono">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Dev Logs</h1>
        <span className="text-muted-foreground">({logs.length} entries)</span>
      </div>

      {logs.length === 0 && (
        <p className="text-muted-foreground">No logs yet. Navigate to the dashboard to generate logs.</p>
      )}

      {logs.map((log, i) => (
        <div key={i} className="mb-3 border-b border-border pb-2">
          <div className={`font-bold ${log.type === "warn" ? "text-neutral" : log.type === "error" ? "text-bearish" : "text-bullish"}`}>
            [{log.time}] {log.type.toUpperCase()}
          </div>
          <div className="text-foreground">{log.message}</div>
          {log.data && (
            <pre className="text-muted-foreground mt-1 overflow-x-auto">{JSON.stringify(log.data, null, 2)}</pre>
          )}
        </div>
      ))}
    </div>
  );
};

export default DevLogs;
