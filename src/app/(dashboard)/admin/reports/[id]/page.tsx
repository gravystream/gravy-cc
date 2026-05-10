"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Report {
  id: string;
  weekStart: string;
  headline: string;
  generatedBy: string;
  createdAt: string;
  metricsJson: any;
  highlightsJson: any;
  anomaliesJson: any;
  recommendationsJson: any;
}

export default function AdminReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [reportId]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/reports/${reportId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return <div className="text-center text-gray-400 py-12">Loading…</div>;
  }

  const highlights = Array.isArray(report.highlightsJson)
    ? report.highlightsJson
    : [];
  const anomalies = Array.isArray(report.anomaliesJson)
    ? report.anomaliesJson
    : [];
  const recommendations = Array.isArray(report.recommendationsJson)
    ? report.recommendationsJson
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to reports
      </Link>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-xs text-gray-500">
          Week of {new Date(report.weekStart).toLocaleDateString()} · Generated{" "}
          {new Date(report.createdAt).toLocaleString()} by{" "}
          <span className="font-mono">{report.generatedBy}</span>
        </p>
        <h1 className="text-2xl font-bold text-white mt-3">
          {report.headline}
        </h1>
      </div>

      <Section title="Highlights" items={highlights} accent="text-green-300" />
      <Section
        title="Anomalies"
        items={anomalies}
        accent="text-yellow-300"
      />
      <Section
        title="Recommendations"
        items={recommendations}
        accent="text-violet-300"
      />

      <details className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
          Raw metrics fed to Claude
        </summary>
        <pre className="mt-4 text-xs text-gray-400 overflow-x-auto bg-black/30 p-4 rounded-lg">
          {JSON.stringify(report.metricsJson, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function Section({
  title,
  items,
  accent,
}: {
  title: string;
  items: any[];
  accent: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className={`text-lg font-semibold mb-3 ${accent}`}>{title}</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-gray-200 text-sm flex gap-3">
            <span className={`${accent}`}>•</span>
            <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
