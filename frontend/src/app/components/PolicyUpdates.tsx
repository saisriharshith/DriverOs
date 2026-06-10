import { useState } from "react";
import { TrendingUp, Shield, FileText, AlertTriangle, Globe, ChevronDown, ChevronUp, Bell, ExternalLink } from "lucide-react";
import { useLang } from "../LanguageContext";

type Impact = "High" | "Medium" | "Low";

const POLICIES = [
  { id: "p1", title: "HSRP Mandatory for All Commercial Vehicles", summary: "High Security Registration Plates mandatory for all trucks from July 1, 2025. Penalty ₹10,000.", detail: "The Ministry of Road Transport has made HSRP mandatory for all registered commercial vehicles. Plates include laser-etched engine and chassis number for tamper-proof identification.", localSummary: "सभी ट्रकों पर 1 जुलाई 2025 से HSRP नंबर प्लेट अनिवार्य है। नहीं लगाने पर ₹10,000 जुर्माना होगा।", impact: "High" as Impact, category: "Compliance", date: "05 Jun 2025", source: "MoRTH", icon: Shield },
  { id: "p2", title: "NH-44 Toll Rate Revision", summary: "Toll charges increased by 5% on NH-44 Nagpur–Hyderabad section effective June 15, 2025.", detail: "NHAI has revised toll rates on NH-44. Two-axle trucks: ₹190 → ₹200. Multi-axle: ₹390 → ₹410.", localSummary: "NH-44 नागपुर से हैदराबाद पर टोल 15 जून 2025 से 5% बढ़ेगा।", impact: "Medium" as Impact, category: "Toll", date: "08 Jun 2025", source: "NHAI", icon: TrendingUp },
  { id: "p3", title: "AIS-140 GPS Tracker Compliance Drive", summary: "All heavy vehicles must have AIS-140 compliant GPS by July 31. Verification checkpoints starting next month.", detail: "AIS-140 compliant GPS tracking devices mandatory in all heavy commercial vehicles. Vehicles without compliance GPS will be fined ₹5,000 and can be impounded.", localSummary: "सभी ट्रकों में AIS-140 GPS 31 जुलाई तक लगाना जरूरी है। बिना GPS के ₹5,000 जुर्माना।", impact: "High" as Impact, category: "Technology", date: "03 Jun 2025", source: "MoRTH", icon: FileText },
  { id: "p4", title: "E-Way Bill Validity Extended", summary: "E-Way bill validity extended from 24 to 48 hours for distances under 100 km.", detail: "GST Council approved extension of E-Way bill validity to 48 hours for consignments under 100 km. For 100–300 km: 72 hours. This reduces pressure on drivers to rush deliveries.", localSummary: "100 km से कम दूरी के लिए E-Way Bill की validity 48 घंटे हो गई है।", impact: "Medium" as Impact, category: "Documentation", date: "01 Jun 2025", source: "GST Council", icon: FileText },
  { id: "p5", title: "Maharashtra Permit Rule Update", summary: "Maharashtra state permits now require biometric verification at RTO.", detail: "Maharashtra Transport Department has updated permit issuance rules. New applicants must visit RTO in person for biometric verification. Online pre-processing available.", localSummary: "महाराष्ट्र में परमिट के लिए अब RTO में जाकर बायोमेट्रिक देना जरूरी है।", impact: "High" as Impact, category: "Permit", date: "28 May 2025", source: "Maharashtra Transport Dept", icon: AlertTriangle },
  { id: "p6", title: "Insurance Premium Rate Guidance", summary: "IRDAI releases updated truck insurance guidelines. Multi-year policies available at discounted rates.", detail: "Multi-year policies (2–3 years) now available with 10–15% discount. Zero depreciation add-ons capped at market rate.", localSummary: "IRDAI ने बताया: 2-3 साल की policy लेने पर 10-15% छूट मिलेगी।", impact: "Low" as Impact, category: "Insurance", date: "22 May 2025", source: "IRDAI", icon: Shield },
];

const IMPACT_COLORS: Record<Impact, string> = { High: "bg-red-100 text-red-700", Medium: "bg-amber-100 text-amber-700", Low: "bg-green-100 text-green-700" };
const CATEGORIES = ["All", "Compliance", "Toll", "Permit", "Insurance", "Documentation", "Technology"];

export function PolicyUpdates() {
  const { t } = useLang();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showLocal, setShowLocal] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = POLICIES.filter(p => activeCategory === "All" || p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-semibold">{t.policyUpdates}</h1>
        <p className="text-white/60 text-sm mt-1">{t.rulesRegulations}</p>
      </div>

      <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-3">
        <Bell size={18} className="text-red-600 shrink-0" />
        <p className="text-red-700 text-sm"><span className="font-semibold">2 {t.urgentAlerts}</span> — {t.urgentCompliance}</p>
      </div>

      <div className="mt-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCategory === cat ? "bg-[#1a4999] text-white" : "bg-white text-[#4a5f7a]"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        {filtered.map(policy => (
          <div key={policy.id} className="bg-white rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${policy.impact === "High" ? "bg-red-100" : policy.impact === "Medium" ? "bg-amber-100" : "bg-green-100"}`}>
                  <policy.icon size={18} className={policy.impact === "High" ? "text-red-600" : policy.impact === "Medium" ? "text-amber-600" : "text-green-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[#0f1c35] text-sm font-semibold leading-tight">{policy.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${IMPACT_COLORS[policy.impact]}`}>{policy.impact}</span>
                  </div>
                  <p className="text-[#4a5f7a] text-xs mt-1">{policy.category} · {policy.date} · {policy.source}</p>
                </div>
              </div>

              <p className="text-[#4a5f7a] text-sm mt-3 leading-relaxed">{policy.summary}</p>

              {showLocal === policy.id && (
                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <p className="text-orange-800 text-sm leading-relaxed">{policy.localSummary}</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => setShowLocal(showLocal === policy.id ? null : policy.id)}
                  className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-1.5 rounded-xl font-semibold">
                  <Globe size={13} />{showLocal === policy.id ? "✓ " : ""}{t.readInHindi}
                </button>
                <button onClick={() => setExpanded(expanded === policy.id ? null : policy.id)}
                  className="flex items-center gap-1.5 bg-[#f0f4f8] text-[#4a5f7a] text-xs px-3 py-1.5 rounded-xl">
                  {expanded === policy.id ? <><ChevronUp size={13} /> {t.less}</> : <><ChevronDown size={13} /> {t.readMore}</>}
                </button>
              </div>
            </div>

            {expanded === policy.id && (
              <div className="px-4 pb-4 border-t border-[#f0f4f8] pt-3">
                <p className="text-[#4a5f7a] text-sm leading-relaxed">{policy.detail}</p>
                <button className="flex items-center gap-1.5 text-[#1a4999] text-sm mt-3 font-semibold">
                  <ExternalLink size={14} /> {t.officialNotification}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
