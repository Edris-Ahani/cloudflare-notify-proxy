"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code,
} from "lucide-react";

export default function TemplatesDashboardPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(
    "🚨 *{{title}}*\nService: `{{service}}`\nStatus: *{{status}}*\nTimestamp: `{{timestamp}}`"
  );
  const [parseMode, setParseMode] = useState("MarkdownV2");
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      const data = await api.templates.list();
      setTemplates(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setIsCreating(true);

    try {
      await api.templates.create({ title, content, parseMode });
      setSuccess("Template created successfully!");
      setTitle("");
      await loadTemplates();
    } catch (err: any) {
      setError(err.message || "Failed to create template.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.templates.delete(id);
      await loadTemplates();
    } catch (err: any) {
      alert(err.message || "Failed to delete template");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Message Templates</h1>
        <p className="text-slate-400 mt-1">
          Define reusable notification templates with dynamic variables like {"{{title}}"} and {"{{timestamp}}"}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Creation Form */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create New Template</h2>
              <p className="text-xs text-slate-400">Supports MarkdownV2 and HTML formatting</p>
            </div>
          </div>

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Template Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deployment Alert or Crash Report"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Parse Mode
              </label>
              <select
                value={parseMode}
                onChange={(e) => setParseMode(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
              >
                <option value="MarkdownV2">MarkdownV2</option>
                <option value="HTML">HTML</option>
                <option value="plain">Plain Text</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Content Template
              </label>
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Interpolate dynamic fields using <code className="text-blue-400">{"{{variable_name}}"}</code>.
              </p>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save Template
            </button>
          </form>
        </div>

        {/* Existing Templates List */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">Saved Templates</h2>

          {templates.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No custom templates created yet.
            </p>
          ) : (
            <div className="space-y-4">
              {templates.map((t) => (
                <div key={t.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-blue-400" />
                      <h3 className="font-semibold text-white text-sm">{t.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t.parseMode}
                      </span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-2.5 rounded bg-slate-900 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap border border-slate-800/60">
                    {t.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
