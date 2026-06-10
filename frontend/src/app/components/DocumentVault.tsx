import { useState } from "react";
import { FileText, Upload, Eye, Share2, AlertTriangle, CheckCircle, Clock, Download, Camera, ChevronRight, X, Shield, Car, User, WifiOff } from "lucide-react";
import { useLang } from "../LanguageContext";

type DocStatus = "valid" | "expiring" | "expired" | "missing";

interface Document {
  id: string; name: string; number: string; expiry: string;
  daysLeft: number; status: DocStatus; category: "driver" | "vehicle";
  uploaded: boolean; lastUpdated: string;
}

const DOCUMENTS: Document[] = [
  { id: "dl", name: "Driving License (HMV)", number: "MH1320140012345", expiry: "15 Aug 2025", daysLeft: 68, status: "expiring", category: "driver", uploaded: true, lastUpdated: "12 Jan 2024" },
  { id: "aadhaar", name: "Aadhaar Card", number: "XXXX-XXXX-4521", expiry: "Lifetime", daysLeft: 9999, status: "valid", category: "driver", uploaded: true, lastUpdated: "01 Mar 2023" },
  { id: "pan", name: "PAN Card", number: "ABCDE1234F", expiry: "Lifetime", daysLeft: 9999, status: "valid", category: "driver", uploaded: true, lastUpdated: "01 Mar 2023" },
  { id: "rc", name: "RC (Registration Certificate)", number: "MH04AB1234", expiry: "01 Jan 2035", daysLeft: 3128, status: "valid", category: "vehicle", uploaded: true, lastUpdated: "14 Feb 2024" },
  { id: "insurance", name: "Vehicle Insurance", number: "POL-2024-MH-88721", expiry: "30 Jun 2025", daysLeft: 22, status: "expired", category: "vehicle", uploaded: true, lastUpdated: "28 Jun 2024" },
  { id: "puc", name: "PUC Certificate", number: "PUC-MH-2025-441", expiry: "10 Jul 2025", daysLeft: 32, status: "expiring", category: "vehicle", uploaded: true, lastUpdated: "10 Jan 2025" },
  { id: "fitness", name: "Fitness Certificate", number: "FC-MH-2025-0891", expiry: "12 Oct 2025", daysLeft: 126, status: "valid", category: "vehicle", uploaded: true, lastUpdated: "12 Apr 2025" },
  { id: "permit", name: "National Permit", number: "NP-2025-MH-3341", expiry: "01 Dec 2025", daysLeft: 176, status: "valid", category: "vehicle", uploaded: false, lastUpdated: "-" },
];

export function DocumentVault() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"all" | "driver" | "vehicle">("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filtered = DOCUMENTS.filter(d => activeTab === "all" || d.category === activeTab);

  function StatusChip({ status, daysLeft }: { status: DocStatus; daysLeft: number }) {
    if (status === "expired") return <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold"><AlertTriangle size={11} /> {t.expired}</span>;
    if (status === "expiring") return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-semibold"><Clock size={11} /> {daysLeft}d</span>;
    if (status === "missing") return <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold"><X size={11} /> {t.missing}</span>;
    return <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold"><CheckCircle size={11} /> {t.valid}</span>;
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-semibold">{t.documentVault}</h1>
        <p className="text-white/60 text-sm mt-1">{t.allDocsSafeOrganized}</p>
        <div className="flex items-center gap-2 mt-3 bg-white/10 rounded-xl px-3 py-2">
          <WifiOff size={14} className="text-green-300" />
          <span className="text-white/80 text-xs">{t.offlineAccess}</span>
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: t.valid, count: DOCUMENTS.filter(d => d.status === "valid").length, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
          { label: t.expiring, count: DOCUMENTS.filter(d => d.status === "expiring").length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          { label: t.expired, count: DOCUMENTS.filter(d => d.status === "expired").length, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-[#4a5f7a] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-1 flex gap-1">
          {[
            { key: "all", label: t.allDocs, icon: FileText },
            { key: "driver", label: t.driverDocs, icon: User },
            { key: "vehicle", label: t.vehicleDocs, icon: Car },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm transition-all ${activeTab === tab.key ? "bg-[#1a4999] text-white font-semibold shadow-sm" : "text-[#4a5f7a]"}`}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3">
        <button onClick={() => setShowUpload(true)} className="w-full bg-orange-500 text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-semibold shadow-md">
          <Upload size={20} />{t.uploadNewDoc}
        </button>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        {filtered.map(doc => (
          <button key={doc.id} onClick={() => setSelectedDoc(doc)} className="bg-white rounded-2xl p-4 flex items-center gap-3 text-left w-full">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${doc.status === "expired" ? "bg-red-100" : doc.status === "expiring" ? "bg-amber-100" : "bg-blue-100"}`}>
              {doc.category === "driver"
                ? <User size={22} className={doc.status === "expired" ? "text-red-600" : doc.status === "expiring" ? "text-amber-600" : "text-[#1a4999]"} />
                : <Car size={22} className={doc.status === "expired" ? "text-red-600" : doc.status === "expiring" ? "text-amber-600" : "text-[#1a4999]"} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#0f1c35] text-sm font-semibold">{doc.name}</p>
              <p className="text-[#4a5f7a] text-xs mt-0.5">{doc.uploaded ? doc.number : t.notUploaded}</p>
              <p className="text-[#4a5f7a] text-xs">{t.expiryDate}: {doc.expiry}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusChip status={doc.status} daysLeft={doc.daysLeft} />
              <ChevronRight size={16} className="text-[#4a5f7a]" />
            </div>
          </button>
        ))}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">{selectedDoc.name}</h3>
              <button onClick={() => setSelectedDoc(null)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="bg-[#f0f4f8] rounded-2xl p-4 mb-4">
              <div className="w-full h-32 bg-[#dce6f0] rounded-xl flex items-center justify-center mb-3">
                {selectedDoc.uploaded
                  ? <div className="text-center"><FileText size={40} className="text-[#1a4999] mx-auto" /><p className="text-[#4a5f7a] text-xs mt-2">Document Uploaded</p></div>
                  : <div className="text-center"><Upload size={40} className="text-[#4a5f7a] mx-auto" /><p className="text-[#4a5f7a] text-xs mt-2">{t.notUploaded}</p></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.docNumber, value: selectedDoc.number },
                  { label: t.expiryDate, value: selectedDoc.expiry },
                  { label: t.category, value: selectedDoc.category === "driver" ? t.driver : t.vehicle },
                  { label: t.lastUpdated, value: selectedDoc.lastUpdated },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[#4a5f7a] text-xs">{label}</p>
                    <p className="text-[#0f1c35] text-sm font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <button className="flex-1 bg-[#1a4999] text-white rounded-xl py-3 flex items-center justify-center gap-2"><Eye size={18} /> {t.view}</button>
              <button className="flex-1 bg-[#f0f4f8] text-[#0f1c35] rounded-xl py-3 flex items-center justify-center gap-2"><Download size={18} /> {t.download}</button>
              <button className="flex-1 bg-[#f0f4f8] text-[#0f1c35] rounded-xl py-3 flex items-center justify-center gap-2"><Share2 size={18} /> {t.share}</button>
            </div>
            {(selectedDoc.status === "expired" || selectedDoc.status === "expiring") && (
              <button className="w-full bg-orange-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-semibold">
                <Shield size={18} /> {t.renewDocument}
              </button>
            )}
          </div>
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">{t.uploadNewDoc}</h3>
              <button onClick={() => setShowUpload(false)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button className="bg-[#1a4999] text-white rounded-2xl py-5 flex flex-col items-center gap-2"><Camera size={28} /><span>{t.takePhoto}</span></button>
              <button className="bg-[#f0f4f8] text-[#0f1c35] rounded-2xl py-5 flex flex-col items-center gap-2"><Upload size={28} /><span>{t.uploadFile}</span></button>
            </div>
            <p className="text-[#4a5f7a] text-xs text-center">Supports JPG, PNG, PDF • Max 5MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
