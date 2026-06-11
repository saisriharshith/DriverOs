import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, ChevronRight, Shield, RefreshCw, Info } from "lucide-react";
import { useLang } from "../LanguageContext";
import { documentService } from "../api/document.service";
import { analyticsService } from "../api/analytics.service";

interface ComplianceItem {
  id: string | number; name: string; expiry: string; daysLeft: number;
  status: "safe" | "warning" | "danger" | "expired" | "pending"; category: string; action: string;
}

function ScoreRing({ score }: { score: number }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#dce6f0" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 65 65)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="65" y="58" textAnchor="middle" fill={color} fontSize="28" fontWeight="700">{score}</text>
      <text x="65" y="76" textAnchor="middle" fill="#4a5f7a" fontSize="11">/100</text>
    </svg>
  );
}

export function ComplianceCenter() {
  const { t } = useLang();
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [score, setScore] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [docs, stats] = await Promise.all([
          documentService.getDocuments(),
          analyticsService.getDashboardStats()
        ]);

        const mapped = docs.map((doc: any) => {
          const expiryDate = doc.expiry_date ? new Date(doc.expiry_date) : null;
          const today = new Date();
          const diffTime = expiryDate ? expiryDate.getTime() - today.getTime() : 0;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          let status: ComplianceItem["status"] = "safe";
          if (doc.status === "EXPIRED") status = "expired";
          else if (doc.status === "PENDING") status = "pending";
          else if (expiryDate && diffDays < 30) status = "warning";

          return {
            id: doc.id,
            name: doc.doc_type,
            expiry: doc.expiry_date || "N/A",
            daysLeft: diffDays > 0 ? diffDays : 0,
            status: status,
            category: doc.vehicle ? "Vehicle" : "Driver",
            action: status === "safe" ? "Valid" : "Renew/Update Document"
          };
        });

        setItems(mapped);
        setScore(stats.compliance_score || 100);
      } catch (err) {
        console.error("Failed to fetch compliance data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const riskLevel = score >= 75 ? t.safeToOperate : score >= 50 ? t.cautionNeeded : t.highRisk;
  const riskColor = score >= 75 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const riskBg = score >= 75 ? "bg-green-50 border-green-200" : score >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  const dangerItems = items.filter(i => i.status === "danger" || i.status === "expired");
  const warnItems = items.filter(i => i.status === "warning");
  const safeItems = items.filter(i => i.status === "safe" || i.status === "pending");

  if (loading) return <p className="text-center text-gray-500 py-10">Loading compliance status...</p>;

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="gradient-header px-4 pt-12 pb-6">
        <h1 className="text-white text-xl font-bold">{t.complianceCenter}</h1>
        <p className="text-white/60 text-sm mt-1">{t.legalStatus}</p>
      </div>

      <div className="px-4 mt-4">
        <div className="card-hover bg-white rounded-3xl p-5">
          <div className="flex items-center gap-6">
            <ScoreRing score={score} />
            <div className="flex-1">
              <p className="text-gray-400 text-xs uppercase tracking-wider">{t.complianceScore}</p>
              <div className={`mt-2 rounded-xl border px-3 py-2 ${riskBg}`}>
                <p className={`text-sm font-semibold ${riskColor}`}>{riskLevel}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center"><p className="text-red-600 font-bold text-lg">{dangerItems.length}</p><p className="text-xs text-[#4a5f7a]">{t.expired}</p></div>
                <div className="text-center"><p className="text-amber-600 font-bold text-lg">{warnItems.length}</p><p className="text-xs text-[#4a5f7a]">{t.expiring}</p></div>
                <div className="text-center"><p className="text-green-600 font-bold text-lg">{safeItems.length}</p><p className="text-xs text-[#4a5f7a]">{t.valid}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dangerItems.length > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-red-600" /><h3 className="text-red-600 font-semibold">{t.immediateAction}</h3></div>
          <div className="flex flex-col gap-2">{dangerItems.map(item => <ComplianceCard key={item.id} item={item} t={t} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />)}</div>
        </div>
      )}
      {warnItems.length > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3"><Clock size={16} className="text-amber-600" /><h3 className="text-amber-600 font-semibold">{t.upcomingRenewals}</h3></div>
          <div className="flex flex-col gap-2">{warnItems.map(item => <ComplianceCard key={item.id} item={item} t={t} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />)}</div>
        </div>
      )}
      {safeItems.length > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center gap-2 mb-3"><CheckCircle size={16} className="text-green-600" /><h3 className="text-green-600 font-semibold">{t.allClear}</h3></div>
          <div className="flex flex-col gap-2">{safeItems.map(item => <ComplianceCard key={item.id} item={item} t={t} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />)}</div>
        </div>
      )}

      <div className="px-4 mt-6 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
          <Info size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-primary text-sm">Driving with expired insurance or permit can result in fines up to ₹20,000 and vehicle seizure.</p>
        </div>
      </div>
    </div>
  );
}

function ComplianceCard({ item, t, expanded, onToggle }: { item: ComplianceItem; t: any; expanded: boolean; onToggle: () => void }) {
  const borderColor = item.status === "expired" ? "border-red-400" : item.status === "warning" ? "border-amber-400" : "border-green-400";
  const iconBg = item.status === "expired" ? "bg-red-100" : item.status === "warning" ? "bg-amber-100" : "bg-green-100";
  const iconColor = item.status === "expired" ? "text-red-600" : item.status === "warning" ? "text-amber-600" : "text-green-600";
  return (
    <div className={`bg-white rounded-2xl border-l-4 ${borderColor} overflow-hidden`}>
      <button className="w-full px-4 py-3 flex items-center gap-3 text-left" onClick={onToggle}>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}><Shield size={18} className={iconColor} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-[#0f1c35] text-sm font-semibold">{item.name}</p>
          <p className="text-gray-400 text-xs">{item.category} · {t.expires} {item.expiry}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.status === "expired" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{t.expired}</span>}
          {item.status === "warning" && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{item.daysLeft}d</span>}
          {item.status === "safe" && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ {t.valid}</span>}
          {item.status === "pending" && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Pending</span>}
          <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#dce6f0] pt-3">
          <p className="text-[#4a5f7a] text-sm mb-3"><span className="font-semibold">{t.requiredAction}:</span> {item.action}</p>
          {item.status !== "safe" && item.status !== "pending" && (
            <button className="w-full btn-primary rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm">
              <RefreshCw size={16} /> {t.renewNow}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
