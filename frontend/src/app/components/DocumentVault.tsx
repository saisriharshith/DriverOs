import { useState, useEffect } from "react";
import { FileText, Upload, Eye, Share2, AlertTriangle, CheckCircle, Clock, Download, Camera, ChevronRight, X, Shield, Car, User, WifiOff, Search } from "lucide-react";
import { useLang } from "../LanguageContext";
import { documentService } from "../api/document.service";
import { vehicleService } from "../api/vehicle.service";

type DocStatus = "valid" | "expiring" | "expired" | "missing" | "pending";

interface Document {
  id: string | number; name: string; number: string; expiry: string;
  daysLeft: number; status: DocStatus; category: "driver" | "vehicle";
  uploaded: boolean; lastUpdated: string; fileUrl?: string;
  vehicle?: { id: number; vehicle_number: string; vehicle_type: string; insurance_expiry: string; permit_expiry: string; puc_expiry: string; } | null;
}

const DOC_TYPES = [
  { value: "LICENSE", label: "Driving License" },
  { value: "RC", label: "Registration Certificate" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "PUC", label: "PUC" },
  { value: "PERMIT", label: "Permit" },
  { value: "FITNESS", label: "Fitness Certificate" },
  { value: "OTHER", label: "Other" },
];

function StatusChip({ status, daysLeft }: { status: DocStatus; daysLeft: number }) {
  const config = {
    expired: { bg: "bg-red-100", text: "text-red-700", icon: AlertTriangle, label: "Expired" },
    expiring: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock, label: `${daysLeft}d` },
    missing: { bg: "bg-gray-100", text: "text-gray-600", icon: X, label: "Missing" },
    pending: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock, label: "Pending" },
    valid: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Valid" },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`flex items-center gap-1 ${c.bg} ${c.text} text-[10px] px-2 py-1 rounded-full font-bold`}>
      <Icon size={10} /> {c.label}
    </span>
  );
}

export function DocumentVault() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"all" | "driver" | "vehicle">("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({ doc_type: "LICENSE", expiry_date: "", vehicle: "" });

  useEffect(() => {
    fetchDocs();
    vehicleService.getVehicles().then(setVehicles).catch(console.error);
  }, []);

  async function fetchDocs() {
    try {
      const data = await documentService.getDocuments();
      const mapped = (data || []).map((doc: any) => {
        const expiryDate = doc.expiry_date ? new Date(doc.expiry_date) : null;
        const today = new Date();
        const diffDays = expiryDate ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        let status: DocStatus = "valid";
        if (doc.status === "EXPIRED") status = "expired";
        else if (doc.status === "PENDING") status = "pending";
        else if (expiryDate && diffDays < 30) status = "expiring";
        const vd = doc.vehicle_detail;
        return {
          id: doc.id,
          name: DOC_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type,
          number: doc.extracted_data?.number || "N/A",
          expiry: doc.expiry_date || "N/A",
          daysLeft: diffDays > 0 ? diffDays : 0,
          status,
          category: doc.vehicle ? "vehicle" : "driver",
          uploaded: true,
          lastUpdated: new Date(doc.upload_date).toLocaleDateString(),
          fileUrl: doc.file_url,
          vehicle: vd ? { id: vd.id || doc.vehicle, vehicle_number: vd.vehicle_number || "", vehicle_type: vd.vehicle_type || "", insurance_expiry: vd.insurance_expiry || "", permit_expiry: vd.permit_expiry || "", puc_expiry: vd.puc_expiry || "" } : null
        };
      });
      setDocuments(mapped);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadDocument() {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file_url", selectedFile);
    formData.append("doc_type", uploadForm.doc_type);
    if (uploadForm.expiry_date) formData.append("expiry_date", uploadForm.expiry_date);
    if (uploadForm.vehicle) formData.append("vehicle", uploadForm.vehicle);
    try {
      setLoading(true);
      await documentService.uploadDocument(formData);
      await fetchDocs();
      setSelectedFile(null);
      setUploadForm({ doc_type: "LICENSE", expiry_date: "", vehicle: "" });
      setShowUpload(false);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = documents.filter(d => activeTab === "all" || d.category === activeTab);

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="gradient-header px-4 pt-12 pb-6">
        <h1 className="text-white text-xl font-bold">{t.documentVault}</h1>
        <p className="text-white/60 text-sm mt-1">{t.allDocsSafeOrganized}</p>
        <div className="flex items-center gap-2 mt-3 bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/10">
          <WifiOff size={14} className="text-green-300" />
          <span className="text-white/80 text-xs font-medium">{t.offlineAccess}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: t.valid, count: documents.filter(d => d.status === "valid").length, color: "text-green-600", bg: "bg-green-50" },
          { label: t.expiring, count: documents.filter(d => d.status === "expiring").length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: t.expired, count: documents.filter(d => d.status === "expired").length, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-1 flex gap-1 shadow-sm">
          {[
            { key: "all" as const, label: t.allDocs, icon: FileText },
            { key: "driver" as const, label: t.driverDocs, icon: User },
            { key: "vehicle" as const, label: t.vehicleDocs, icon: Car },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm transition-all font-semibold ${
                activeTab === tab.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              style={activeTab === tab.key ? { background: "linear-gradient(135deg, #1a4999, #2563eb)" } : {}}>
              <tab.icon size={14} />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload CTA */}
      <div className="px-4 mt-3">
        <button onClick={() => setShowUpload(true)}
          className="w-full text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-bold shadow-md"
          style={{ background: "linear-gradient(135deg, #f07c1e, #ea580c)" }}>
          <Upload size={20} />{t.uploadNewDoc}
        </button>
      </div>

      {/* Document List */}
      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-sm" />)
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <FileText size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-semibold">No documents found</p>
            <p className="text-gray-300 text-sm mt-1">Upload your first document to get started</p>
          </div>
        ) : filtered.map(doc => (
          <button key={doc.id} onClick={() => setSelectedDoc(doc)}
            className="bg-white rounded-2xl p-4 flex items-center gap-3 text-left w-full card-hover shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              doc.status === "expired" ? "bg-red-100" : doc.status === "expiring" ? "bg-amber-100" : "bg-blue-100"
            }`}>
              {doc.category === "driver"
                ? <User size={22} className={doc.status === "expired" ? "text-red-600" : doc.status === "expiring" ? "text-amber-600" : "text-primary"} />
                : <Car size={22} className={doc.status === "expired" ? "text-red-600" : doc.status === "expiring" ? "text-amber-600" : "text-primary"} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-sm font-bold">{doc.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">{doc.number}</p>
              <p className="text-gray-400 text-xs">Expires: {doc.expiry}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusChip status={doc.status} daysLeft={doc.daysLeft} />
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </button>
        ))}
      </div>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-800 text-lg font-bold">{selectedDoc.name}</h3>
              <button onClick={() => setSelectedDoc(null)}><X size={22} className="text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="w-full h-36 bg-gray-200 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                {selectedDoc.fileUrl
                  ? <img src={selectedDoc.fileUrl} alt={selectedDoc.name} className="w-full h-full object-cover" />
                  : <div className="text-center"><Upload size={40} className="text-gray-300 mx-auto" /><p className="text-gray-400 text-xs mt-2">{t.notUploaded}</p></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.docNumber, value: selectedDoc.number },
                  { label: t.expiryDate, value: selectedDoc.expiry },
                  { label: t.category, value: selectedDoc.category === "driver" ? t.driver : t.vehicle },
                  { label: t.lastUpdated, value: selectedDoc.lastUpdated },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-gray-400 text-xs">{label}</p>
                    <p className="text-gray-800 text-sm font-bold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {selectedDoc.vehicle && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-800 text-sm font-bold mb-2">Vehicle Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Number", value: selectedDoc.vehicle.vehicle_number },
                      { label: "Type", value: selectedDoc.vehicle.vehicle_type },
                      { label: "Insurance", value: selectedDoc.vehicle.insurance_expiry || "N/A" },
                      { label: "Permit", value: selectedDoc.vehicle.permit_expiry || "N/A" },
                      { label: "PUC", value: selectedDoc.vehicle.puc_expiry || "N/A" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-gray-400 text-xs">{label}</p>
                        <p className="text-gray-800 text-sm font-bold mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <a href={selectedDoc.fileUrl} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 text-white rounded-xl py-3 font-bold"
                style={{ background: "linear-gradient(135deg, #1a4999, #2563eb)" }}>
                <Eye size={18} /> {t.view}
              </a>
              <a href={selectedDoc.fileUrl} download
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 flex items-center justify-center gap-2 font-semibold">
                <Download size={18} /> {t.download}
              </a>
              <button className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 flex items-center justify-center gap-2 font-semibold">
                <Share2 size={18} /> {t.share}
              </button>
            </div>
            {(selectedDoc.status === "expired" || selectedDoc.status === "expiring") && (
              <button className="w-full text-white rounded-xl py-3 flex items-center justify-center gap-2 font-bold"
                style={{ background: "linear-gradient(135deg, #f07c1e, #ea580c)" }}>
                <Shield size={18} /> {t.renewDocument}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[86vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-800 text-lg font-bold">{t.uploadNewDoc}</h3>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); }}><X size={22} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-gray-400 text-xs mb-1 font-medium">Document Type</p>
                <select className="w-full bg-transparent text-gray-800 text-sm outline-none font-medium"
                  value={uploadForm.doc_type} onChange={e => setUploadForm(prev => ({ ...prev, doc_type: e.target.value }))}>
                  {DOC_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-gray-400 text-xs mb-1 font-medium">{t.expiryDate}</p>
                <input type="date" className="w-full bg-transparent text-gray-800 text-sm outline-none font-medium"
                  value={uploadForm.expiry_date} onChange={e => setUploadForm(prev => ({ ...prev, expiry_date: e.target.value }))} />
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-gray-400 text-xs mb-1 font-medium">Vehicle</p>
                <select className="w-full bg-transparent text-gray-800 text-sm outline-none font-medium"
                  value={uploadForm.vehicle} onChange={e => setUploadForm(prev => ({ ...prev, vehicle: e.target.value }))}>
                  <option value="">Driver document (no vehicle)</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <label className="text-white rounded-2xl py-5 flex flex-col items-center gap-2 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #1a4999, #2563eb)" }}>
                <Camera size={28} /><span className="font-bold">{t.takePhoto}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
              <label className="bg-gray-100 text-gray-700 rounded-2xl py-5 flex flex-col items-center gap-2 cursor-pointer">
                <Upload size={28} /><span className="font-bold">{t.uploadFile}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-green-700 text-sm font-bold truncate">{selectedFile.name}</p>
                <p className="text-green-600 text-xs">{Math.ceil(selectedFile.size / 1024)} KB selected</p>
              </div>
            )}
            <button onClick={handleUploadDocument} disabled={!selectedFile}
              className="w-full text-white rounded-2xl py-4 font-bold disabled:opacity-50 shadow-md"
              style={{ background: "linear-gradient(135deg, #f07c1e, #ea580c)" }}>
              {t.uploadNewDoc}
            </button>
            <p className="text-gray-400 text-xs text-center mt-2">Supports JPG, PNG, PDF • Max 5MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
