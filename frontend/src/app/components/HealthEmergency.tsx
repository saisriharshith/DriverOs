import { useState, useEffect } from "react";
import { Heart, Phone, MapPin, AlertTriangle, User, Plus, X, Zap, Shield, Activity } from "lucide-react";
import { useLang } from "../LanguageContext";
import { emergencyService } from "../api/emergency.service";
import { authService } from "../api/auth.service";
import { driverService } from "../api/driver.service";

export function HealthEmergency() {
  const { t } = useLang();
  const [sosPressed, setSosPressed] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    relationship: "",
  });
  const [profileForm, setProfileForm] = useState({
    blood_group: "",
    height_cm: "",
    weight_kg: "",
    medical_conditions: "",
    medications: "",
    allergies: "",
    doctor_name: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [u, d, c] = await Promise.all([
          authService.getProfile(),
          driverService.getProfile(),
          driverService.getEmergencyContacts()
        ]);
        setUser(u);
        setDriver(d);
        if (d) {
          setProfileForm({
            blood_group: d.blood_group || "",
            height_cm: d.height_cm || "",
            weight_kg: d.weight_kg || "",
            medical_conditions: d.medical_conditions || "",
            medications: d.medications || "",
            allergies: d.allergies || "",
            doctor_name: d.doctor_name || "",
          });
        }
        setContacts(c);
      } catch (err) {
        console.error("Failed to load health/emergency data", err);
      }
    }
    loadData();
  }, []);

  async function triggerSOS() {
    try {
      // Mock location for now as per dashboard
      await emergencyService.sendSOS(18.5204, 73.8567, "SOS");
      setSosTriggered(true);
    } catch (err) {
      console.error("Failed to trigger SOS", err);
    }
  }

  async function saveEmergencyContact() {
    if (!contactForm.name || !contactForm.phone) return;
    try {
      await driverService.addEmergencyContact(contactForm);
      const updatedContacts = await driverService.getEmergencyContacts();
      setContacts(updatedContacts);
      setContactForm({ name: "", phone: "", relationship: "" });
      setShowAddContact(false);
    } catch (err) {
      console.error("Failed to save emergency contact", err);
    }
  }

  async function handleSaveProfile() {
    try {
      const payload = { ...profileForm };
      // Convert empty strings to null for integer fields
      if ((payload as any).height_cm === "") (payload as any).height_cm = null;
      if ((payload as any).weight_kg === "") (payload as any).weight_kg = null;
      
      const updated = await driverService.updateProfile(payload);
      setDriver(updated);
      setShowEditProfile(false);
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  }

  function handleSOS() {
    setSosPressed(true);
    let count = 5;
    const timer = setInterval(() => {
      count--;
      setSosCountdown(count);
      if (count <= 0) { 
        clearInterval(timer); 
        triggerSOS();
      }
    }, 1000);
  }

  const EMERGENCY_NUMBERS = [
    { label: "Ambulance", number: "108", color: "bg-red-600", icon: Heart },
    { label: "Police", number: "100", color: "bg-blue-700", icon: Shield },
    { label: "Highway Help", number: "1033", color: "bg-orange-600", icon: MapPin },
    { label: "Fire", number: "101", color: "bg-red-800", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      <div className="bg-[#1a4999] px-4 pt-10 pb-5">
        <h1 className="text-white text-xl font-semibold">{t.healthEmergency}</h1>
        <p className="text-white/60 text-sm mt-1">{t.safetySystem}</p>
      </div>

      {/* SOS Button */}
      <div className="px-4 mt-5">
        <div className="bg-white rounded-3xl p-5 text-center">
          <p className="text-[#4a5f7a] text-sm mb-4">{t.pressHoldSOS}</p>
          {!sosTriggered ? (
            <button
              onPointerDown={handleSOS}
              onPointerUp={() => { if (!sosTriggered) { setSosPressed(false); setSosCountdown(5); } }}
              className={`w-40 h-40 rounded-full mx-auto flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform ${sosPressed ? "bg-red-700 animate-pulse" : "bg-red-600"}`}
            >
              <Zap size={44} className="text-white" />
              <span className="text-white font-bold text-xl">SOS</span>
              {sosPressed && <span className="text-white/80 text-sm">{t.sendingIn} {sosCountdown}s</span>}
            </button>
          ) : (
            <div className="w-40 h-40 rounded-full bg-green-600 mx-auto flex flex-col items-center justify-center gap-2 shadow-2xl">
              <Activity size={40} className="text-white" /><span className="text-white font-bold">{t.alertSent.split("!")[0]}!</span>
            </div>
          )}
          {sosTriggered && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-3">
              <p className="text-green-700 text-sm font-semibold">{t.alertSent}</p>
              <p className="text-green-600 text-xs mt-1">{t.locationShared}</p>
            </div>
          )}
          {!sosTriggered && <p className="text-[#4a5f7a] text-xs mt-3">NH-44, near Butibori, Nagpur</p>}
        </div>
      </div>

      {/* Emergency Numbers */}
      <div className="px-4 mt-4">
        <h3 className="text-[#0f1c35] font-semibold mb-3">{t.emergencyNumbers}</h3>
        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_NUMBERS.map(({ label, number, color, icon: Icon }) => (
            <a key={label} href={`tel:${number}`} className={`${color} text-white rounded-2xl p-4 flex items-center gap-3`}>
              <Icon size={24} />
              <div><p className="font-bold text-lg">{number}</p><p className="text-white/80 text-xs">{label}</p></div>
            </a>
          ))}
        </div>
      </div>

      {/* Medical Profile */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#0f1c35] font-semibold">{t.medicalProfile}</h3>
          <button onClick={() => setShowEditProfile(true)} className="text-[#1a4999] text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus size={12} /> Edit
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <Heart size={22} className="text-red-500" />
            </div>
            <div>
              <p className="text-[#0f1c35] font-semibold">{user?.name || "Driver"}</p>
              <p className="text-[#4a5f7a] text-xs">Phone: {user?.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t.bloodGroup, value: driver?.blood_group || "Not added", highlight: true },
              { label: "Height / Weight", value: `${driver?.height_cm || "N/A"} cm / ${driver?.weight_kg || "N/A"} kg` },
              { label: "Conditions", value: driver?.medical_conditions || "Not added" },
              { label: "Medications", value: driver?.medications || "Not added" },
              { label: "Allergies", value: driver?.allergies || "Not added" },
              { label: "Doctor", value: driver?.doctor_name || "Not added" },
            ].map(({ label, value, highlight }) => (
              <div key={label} className={`rounded-xl p-3 ${highlight ? "bg-red-50 border border-red-200" : "bg-[#f0f4f8]"}`}>
                <p className="text-[#4a5f7a] text-xs">{label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-red-700 text-lg" : "text-[#0f1c35]"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[#0f1c35] font-semibold">{t.emergencyContacts}</h3>
          <button onClick={() => setShowAddContact(true)} className="bg-[#1a4999] text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-1">
            <Plus size={13} /> {t.addContact}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1a4999] rounded-xl flex items-center justify-center shrink-0">
                <User size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0f1c35] text-sm font-semibold">{contact.name}</p>
                <p className="text-[#4a5f7a] text-xs">{contact.relationship} · {contact.phone}</p>
              </div>
              <a href={`tel:${contact.phone}`} className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <Phone size={18} className="text-green-600" />
              </a>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No emergency contacts added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Accident Workflow */}
      <div className="px-4 mt-5 mb-4">
        <h3 className="text-[#0f1c35] font-semibold mb-3">{t.accidentSteps}</h3>
        <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
          {[
            { step: "1", text: "Stay calm — turn on hazard lights", color: "bg-amber-100 text-amber-700" },
            { step: "2", text: "Call 108 for ambulance if injured", color: "bg-red-100 text-red-700" },
            { step: "3", text: "Call 100 for police if needed", color: "bg-blue-100 text-[#1a4999]" },
            { step: "4", text: "Share your live location via SOS above", color: "bg-green-100 text-green-700" },
            { step: "5", text: "Take photos of the accident scene", color: "bg-purple-100 text-purple-700" },
            { step: "6", text: "Notify your fleet owner / family", color: "bg-teal-100 text-teal-700" },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-xs font-bold shrink-0`}>{step}</span>
              <span className="text-[#0f1c35] text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">Update Medical Profile</h3>
              <button onClick={() => setShowEditProfile(false)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              {[
                { key: "blood_group", label: "Blood Group" },
                { key: "height_cm", label: "Height (cm)" },
                { key: "weight_kg", label: "Weight (kg)" },
                { key: "medical_conditions", label: "Medical Conditions" },
                { key: "medications", label: "Medications" },
                { key: "allergies", label: "Allergies" },
                { key: "doctor_name", label: "Doctor Name" },
              ].map(field => (
                <div key={field.key} className="bg-[#f0f4f8] rounded-xl px-4 py-3">
                  <p className="text-[#4a5f7a] text-xs mb-1">{field.label}</p>
                  <input
                    className="w-full bg-transparent text-[#0f1c35] text-sm outline-none"
                    placeholder={field.label}
                    value={(profileForm as any)[field.key]}
                    onChange={e => setProfileForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveProfile}
              className="w-full bg-[#1a4999] text-white rounded-2xl py-4 font-semibold"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#0f1c35] text-lg font-semibold">{t.addContact}</h3>
              <button onClick={() => setShowAddContact(false)}><X size={22} className="text-[#4a5f7a]" /></button>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              {[
                { key: "name", label: t.fullName },
                { key: "phone", label: t.phoneNumber },
                { key: "relationship", label: t.relation },
              ].map(field => (
                <div key={field.key} className="bg-[#f0f4f8] rounded-xl px-4 py-3">
                  <p className="text-[#4a5f7a] text-xs mb-1">{field.label}</p>
                  <input
                    className="w-full bg-transparent text-[#0f1c35] text-sm outline-none"
                    placeholder={field.label}
                    value={(contactForm as any)[field.key]}
                    onChange={e => setContactForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveEmergencyContact}
              disabled={!contactForm.name || !contactForm.phone}
              className="w-full bg-[#1a4999] text-white rounded-2xl py-4 font-semibold disabled:opacity-50"
            >
              {t.saveContact}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
