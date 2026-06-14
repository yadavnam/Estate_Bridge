'use client';

import React, { useState } from 'react';
import { ShieldAlert, Search, Database, Clock, Eye, User, FileJson } from 'lucide-react';

interface AuditConsoleClientProps {
  initialLogs: any[];
}

export default function AuditConsoleClient({ initialLogs }: AuditConsoleClientProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    initialLogs.length > 0 ? initialLogs[0].log_id : null
  );
  
  const [searchTerm, setSearchTerm] = useState('');

  const activeLog = initialLogs.find(l => l.log_id === selectedLogId);

  // Filter logs by search term
  const filteredLogs = initialLogs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity_type.toLowerCase().includes(term) ||
      (log.users?.email || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 min-h-[550px]">
      
      {/* Sidebar - Search and Logs List */}
      <div className="space-y-4 lg:border-r lg:border-zinc-800 lg:pr-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-550 text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            Search Log Actions
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            placeholder="Search action, email, table..."
          />
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isSelected = selectedLogId === log.log_id;
              return (
                <div
                  key={log.log_id}
                  onClick={() => setSelectedLogId(log.log_id)}
                  className={`p-3.5 border rounded-xl cursor-pointer hover:border-zinc-700 transition-all space-y-2 ${
                    isSelected ? 'border-violet-650 bg-zinc-800/40 border-violet-600' : 'border-zinc-800 bg-zinc-950/20'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-800 text-[8px] font-bold rounded uppercase tracking-wide">
                      {log.entity_type}
                    </span>
                    <span className="text-[9px] text-zinc-550 text-zinc-500 font-medium">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-[11px] text-white truncate">
                    {log.action}
                  </h4>
                  <div className="text-[9px] text-zinc-500 truncate">
                    Author: {log.users?.email || 'System'}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-8 text-zinc-650 text-xs">
              No matching audit logs found.
            </div>
          )}
        </div>
      </div>

      {/* Main Panel - JSON Diffs view */}
      <div className="lg:col-span-2 flex flex-col justify-between h-[480px]">
        {activeLog ? (
          <div className="flex flex-col justify-between h-full space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
            
            {/* Header info */}
            <div className="border-b border-zinc-850 pb-3 space-y-1.5">
              <span className="text-[9px] bg-violet-950 text-violet-400 border border-violet-900/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Log Audit Record
              </span>
              <h4 className="font-extrabold text-sm text-white">
                Action: {activeLog.action}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-400">
                <p>Entity: <strong className="text-zinc-200">{activeLog.entity_type} ({activeLog.entity_id})</strong></p>
                <p>Author: <strong className="text-zinc-200">{activeLog.users?.email || 'System'}</strong></p>
                <p>Timestamp: <strong className="text-zinc-200">{new Date(activeLog.created_at).toLocaleString()}</strong></p>
              </div>
            </div>

            {/* Diffs Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* Old Values */}
              <div className="space-y-2 flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  Pre-Transaction State (Old Value)
                </span>
                <div className="flex-1 bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl font-mono text-[10px] overflow-auto max-h-[220px]">
                  {activeLog.old_value ? (
                    <pre className="text-zinc-400 leading-normal">
                      {JSON.stringify(activeLog.old_value, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-zinc-650 text-zinc-650 text-zinc-650 italic">No pre-existing values (INSERT action).</span>
                  )}
                </div>
              </div>

              {/* New Values */}
              <div className="space-y-2 flex flex-col">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide flex items-center gap-1">
                  <FileJson className="w-3.5 h-3.5" />
                  Post-Transaction State (New Value)
                </span>
                <div className="flex-1 bg-zinc-950/80 border border-violet-900/10 p-4 rounded-xl font-mono text-[10px] overflow-auto max-h-[220px]">
                  {activeLog.new_value ? (
                    <pre className="text-violet-300 leading-normal">
                      {JSON.stringify(activeLog.new_value, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-zinc-650 text-zinc-650 text-zinc-650 italic">No post-existing values (DELETE action).</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
            Select an audit log from the search checklist to inspect JSON details.
          </div>
        )}
      </div>

    </div>
  );
}
