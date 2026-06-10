import { useState, useEffect } from "react";
import { FileText, Upload, Eye, Share2, AlertTriangle, CheckCircle, Clock, Download, Camera, ChevronRight, X, Shield, Car, User, WifiOff } from "lucide-react";
import { useLang } from "../LanguageContext";
import { documentService } from "../api/document.service";
import { vehicleService } from "../api/vehicle.service";

type DocStatus = "valid" | "expiring" | "expired" | "missing" | "pending";

interface Document {
  id: string | number; name: string; number: string; expiry: string;
  daysLeft: number; status: DocStatus; category: "driver" | "vehicle";
  uploaded: boolean; lastUpdated: string; fileUrl?: string;
  vehicle?: {
    id: number;
    vehicle_number: string;
    vehicle_type: string;
    insurance_expiry: string;
    permit_expiry: string;
    puc_expiry: string;
  } | null;
}

interface VehicleOption {
  id: number;
  vehicle_number: string;
  vehicle_type?: string;
  insurance_expiry?: string;
  permit_expiry?: string;
  puc_expiry?: string;
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

export function DocumentVault() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<"all" | "driver" | "vehicle">("all");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    doc_type: "LICENSE",
    expiry_date: "",
    vehicle: "",
  });

  useEffect(() => {
    fetchDocs();
    vehicleService.getVehicles().then(setVehicles).catch(console.error);
  }, []);

  async function fetchDocs() {
    try {
      const data = await documentService.getDocuments();
      const mapped = data.map((doc: any) => {
        const expiryDate = doc.expiry_date ? new Date(doc.expiry_date) : null;
        const today = new Date();
        const diffTime = expiryDate ? expiryDate.getTime() - today.getTime() : 0;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let status: DocStatus = "valid";
        if (doc.status === "EXPIRED") status = "expired";
        else if (doc.status === "PENDING") status = "pending";
        else if (expiryDate && diffDays < 30) status = "expiring";

        const vehicleDetail = doc.vehicle_detail;

        return {
          id: doc.id,
          name: doc.doc_type,
          number: doc.extracted_data?.number || "N/A",
          expiry: doc.expiry_date || "N/A",
          daysLeft: diffDays > 0 ? diffDays : 0,
          status: status,
          category: doc.vehicle ? "vehicle" : "driver",
          uploaded: true,
          lastUpdated: new Date(doc.upload_date).toLocaleDateString(),
          fileUrl: doc.file_url,
          vehicle: vehicleDetail ? {
            id: doc.vehicle,
            vehicle_number: vehicleDetail.vehicle_number,
            vehicle_type: vehicleDetail.vehicle_type,
            insurance_expiry: vehicleDetail.insurance_expiry,
            permit_expiry: vehicleDetail.permit_expiry,
            puc_expiry: vehicleDetail.puc_expiry,
          } : null
        };
      });
      setDocuments(mapped);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
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

  function StatusChip({ status, daysLeft }: { status: DocStatus; daysLeft: number }) {
    if (status === "expired") return <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold"><AlertTriangle size={11} /> {t.expired}</span>;
    if (status === "expiring") return <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-semibold"><Clock size={11} /> {daysLeft}d</span>;
    if (status === "missing") return <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold"><X size={11} /> {t.missing}</span>;
    if (status === "pending") return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold"><Clock size={11} /> {t.pending}</span>;
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
          { label: t.valid, count: documents.filter(d => d.status === "valid").length, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
          { label: t.expiring, count: documents.filter(d => d.status === "expiring").length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
          { label: t.expired, count: documents.filter(d => d.status === "expired").length, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
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
        {loading ? (
           <p className="text-center text-gray-500">Loading documents...</p>
        ) : filtered.length === 0 ? (
           <p className="text-center text-gray-500">No documents found</p>
        ) : filtered.map(doc => (
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
              <div className="w-full h-32 bg-[#dce6f0] rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                {selectedDoc.fileUrl
                  ? <img src={selectedDoc.fileUrl} alt={selectedDoc.name} className="w-full h-full object-cover" />
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
              {selectedDoc.vehicle && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-[#0f1c35] text-sm font-semibold mb-2">{t.vehicleManagement}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Vehicle Number", value: selectedDoc.vehicle.vehicle_number },
                      { label: "Vehicle Type", value: selectedDoc.vehicle.vehicle_type },
                      { label: "Insurance Expiry", value: selectedDoc.vehicle.insurance_expiry || "N/A" },
                      { label: "Permit Expiry", value: selectedDoc.vehicle.permit_expiry || "N/A" },
                      { label: "PUC Expiry", value: selectedDoc.vehicle.puc_expiry || "N/A" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[#4a5f7a] text-xs">{label}</p>
                        <p className="text-[#0f1c35] text-sm font-semibold mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <a href={selectedDoc.fileUrl} target="_blank" rel="noreferrer" className="flex-1 bg-[#1a4999] text-white rounded-xl py-3 flex items-center justify-center gap-2"><Eye size={18} /> {t.view}</a>
              <a href={selectedDoc.fileUrl} download className="flex-1 bg-[#f0f4f8] text-[#0f1c35] rounded-xl py-3 flex items-center justify-center gap-2"><Download size={18} /> {t.download}</a>
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
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[86vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">{t.uploadNewDoc}</h3>
              <button onClick={() => { setShowUpload(false); setSelectedFile(null); }}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3">
                <p className="text-[#4a5f7a] text-xs mb-1">Document Type</p>
                <select
                  className="w-full bg-transparent text-[#0f1c35] text-sm outline-none"
                  value={uploadForm.doc_type}
                  onChange={e => setUploadForm(prev => ({ ...prev, doc_type: e.target.value }))}
                >
                  {DOC_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3">
                <p className="text-[#4a5f7a] text-xs mb-1">{t.expiryDate}</p>
                <input
                  type="date"
                  className="w-full bg-transparent text-[#0f1c35] text-sm outline-none"
                  value={uploadForm.expiry_date}
                  onChange={e => setUploadForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
              <div className="bg-[#f0f4f8] rounded-xl px-4 py-3">
                <p className="text-[#4a5f7a] text-xs mb-1">Vehicle</p>
                <select
                  className="w-full bg-transparent text-[#0f1c35] text-sm outline-none"
                  value={uploadForm.vehicle}
                  onChange={e => setUploadForm(prev => ({ ...prev, vehicle: e.target.value }))}
                >
                  <option value="">Driver document</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_number}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <label className="bg-[#1a4999] text-white rounded-2xl py-5 flex flex-col items-center gap-2 cursor-pointer">
                <Camera size={28} /><span>{t.takePhoto}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFilePick} />
              </label>
              <label className="bg-[#f0f4f8] text-[#0f1c35] rounded-2xl py-5 flex flex-col items-center gap-2 cursor-pointer">
                <Upload size={28} /><span>{t.uploadFile}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFilePick} />
              </label>
            </div>
            {selectedFile && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-green-700 text-sm font-semibold truncate">{selectedFile.name}</p>
                <p className="text-green-600 text-xs">{Math.ceil(selectedFile.size / 1024)} KB selected</p>
              </div>
            )}
            <button
              onClick={handleUploadDocument}
              disabled={!selectedFile}
              className="w-full bg-orange-500 text-white rounded-2xl py-4 font-semibold disabled:opacity-50"
            >
              {t.uploadNewDoc}
            </button>
            <p className="text-[#4a5f7a] text-xs text-center">Supports JPG, PNG, PDF • Max 5MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
