import { useState, useEffect } from "react";
import { devLogger } from "@/lib/devLogger";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DevLogs = () => {
  const [logs, setLogs] = useState(devLogger.logs);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "info" | "warn" | "error">("all");

  useEffect(() => {
    const i = setInterval(() => {
      setLogs([...devLogger.logs]);
    }, 1000);
    return () => clearInterval(i);
  }, []);

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredLogs = logs.filter((log) => {
    if (typeFilter !== "all" && log.type !== typeFilter) return false;
    if (normalizedTerm === "") return true;

    const messageMatch = log.message.toLowerCase().includes(normalizedTerm);
    const typeMatch = log.type.toLowerCase().includes(normalizedTerm);
    const dataMatch = log.data ? JSON.stringify(log.data).toLowerCase().includes(normalizedTerm) : false;
    return messageMatch || typeMatch || dataMatch;
  });

  return (
    <div className="p-4 bg-background text-bullish min-h-screen text-xs font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Dev Logs</h1>
          <span className="text-muted-foreground">({logs.length} entries)</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter logs..."
            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring focus:ring-primary"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "info" | "warn" | "error")}
            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring focus:ring-primary"
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <p className="text-muted-foreground">No matching logs. Change filter text or type and try again.</p>
      )}

      {filteredLogs.map((log, i) => (
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
