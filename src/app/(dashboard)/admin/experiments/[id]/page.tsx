"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  metric: string;
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "ABANDONED";
  startDate: string | null;
  endDate: string | null;
  sampleSize: number;
  controlData: any;
  variantData: any;
  results: any;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-700/40 text-gray-200 border-gray-500/40",
  RUNNING: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  COMPLETED: "bg-green-900/40 text-green-300 border-green-700/40",
  ABANDONED: "bg-red-900/40 text-red-300 border-red-800/40",
};

export default function AdminExperimentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const expId = params.id as string;

  const [exp, setExp] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [controlText, setControlText] = useState("");
  const [variantText, setVariantText] = useState("");
  const [resultsText, setResultsText] = useState("");

  useEffect(() => {
    void load();
  }, [expId]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/experiments/${expId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setExp(data.experiment);
      setControlText(
        data.experiment.controlData
          ? JSON.stringify(data.experiment.controlData, null, 2)
          : ""
      );
      setVariantText(
        data.experiment.variantData
          ? JSON.stringify(data.experiment.variantData, null, 2)
          : ""
      );
      setResultsText(
        data.experiment.results
          ? JSON.stringify(data.experiment.results, null, 2)
          : ""
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const transition = async (status: Experiment["status"]) => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/admin/experiments/${expId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to transition");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transition");
    } finally {
      setSaving(false);
    }
  };

  const saveData = async () => {
    setError(null);
    const parse = (text: string, label: string) => {
      if (!text.trim()) return null;
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`${label} is not valid JSON`);
      }
    };

    try {
      setSaving(true);
      const payload = {
        controlData: parse(controlText, "Control data"),
        variantData: parse(variantText, "Variant data"),
        results: parse(resultsText, "Results"),
      };
      const res = await fetch(`/api/admin/experiments/${expId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteExp = async () => {
    if (!confirm("Delete this experiment?")) return;
    const res = await fetch(`/api/admin/experiments/${expId}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/admin/experiments");
  };

  if (loading || !exp) {
    return <div className="text-center text-gray-400 py-12">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/experiments"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to experiments
      </Link>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{exp.name}</h1>
              <span
                className={`text-xs px-2 py-0.5 rounded border ${STATUS_BADGE[exp.status]}`}
              >
                {exp.status}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-3">{exp.hypothesis}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Metric</p>
                <p className="text-sm text-white font-mono">{exp.metric}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sample size</p>
                <p className="text-sm text-white">
                  {exp.sampleSize.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Started</p>
                <p className="text-sm text-white">
                  {exp.startDate
                    ? new Date(exp.startDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ended</p>
                <p className="text-sm text-white">
                  {exp.endDate
                    ? new Date(exp.endDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={deleteExp}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status transitions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-wrap gap-2">
        {exp.status === "DRAFT" && (
          <button
            disabled={saving}
            onClick={() => transition("RUNNING")}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            Start experiment
          </button>
        )}
        {exp.status === "RUNNING" && (
          <>
            <button
              disabled={saving}
              onClick={() => transition("COMPLETED")}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50"
            >
              Mark completed
            </button>
            <button
              disabled={saving}
              onClick={() => transition("ABANDONED")}
              className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              Abandon
            </button>
          </>
        )}
        {(exp.status === "COMPLETED" || exp.status === "ABANDONED") && (
          <p className="text-sm text-gray-400">
            Experiment is {exp.status.toLowerCase()}.
          </p>
        )}
      </div>

      {/* JSON data editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <JsonEditor
          label="Control data"
          value={controlText}
          onChange={setControlText}
        />
        <JsonEditor
          label="Variant data"
          value={variantText}
          onChange={setVariantText}
        />
      </div>
      <JsonEditor
        label="Results"
        value={resultsText}
        onChange={setResultsText}
      />

      <button
        onClick={saveData}
        disabled={saving}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save data"}
      </button>
    </div>
  );
}

function JsonEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <p className="text-sm font-semibold text-white mb-2">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="JSON object — e.g. { conversionRate: 0.12, n: 5000 }"
        rows={8}
        className="w-full px-3 py-2 bg-black/30 border border-gray-700 rounded-lg text-gray-200 text-sm font-mono"
      />
    </div>
  );
}
