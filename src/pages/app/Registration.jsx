import React, { useState, useRef } from "react";
import { UserCheck, ChevronLeft, Upload, CheckCircle2, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabase/client";
import { useAuth } from "@/lib/AuthContext";

const STEPS = ["ID Number", "ID Document", "Utility Bill", "Review"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current ? "bg-[#396978] text-white" : i === current ? "border-2 border-[#396978] text-[#396978]" : "border-2 border-[#d1c6b7] text-[#9aa3a8]"
            }`}>
              {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`mt-1 text-[10px] font-semibold tracking-wide ${i === current ? "text-[#396978]" : "text-[#9aa3a8]"}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 ${i < current ? "bg-[#396978]" : "bg-[#d1c6b7]"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FileDropZone({ label, hint, file, onFile, accept }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
        dragging ? "border-[#396978] bg-[#396978]/6" : file ? "border-[#396978]/50 bg-[#396978]/6" : "border-[#d1c6b7] hover:border-[#396978]/50"
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="w-10 h-10 text-[#396978]" />
          <p className="text-sm font-semibold text-[#22303a]">{file.name}</p>
          <p className="text-xs text-[#66737c]">{(file.size / 1024).toFixed(0)} KB — click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-10 h-10 text-[#9aa3a8]" />
          <p className="text-sm font-semibold text-[#22303a]">{label}</p>
          <p className="text-xs text-[#66737c]">{hint}</p>
          <p className="text-[10px] text-[#9aa3a8] mt-1">JPG, PNG, PDF — max 10 MB</p>
        </div>
      )}
    </div>
  );
}

export default function Registration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [utilityFile, setUtilityFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const next = () => setStep((s) => s + 1);
  const back = () => { setError(""); setStep((s) => s - 1); };

  const uploadFile = async (file, path) => {
    const { error } = await supabase.storage
      .from("verification-documents")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("verification-documents").getPublicUrl(path);
    // Since bucket is private, store the path and generate signed URLs on demand
    return `${user.id}/${path.split("/").pop()}`;
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const idPath = `${user.id}/id-document.${idFile.name.split(".").pop()}`;
      const utilityPath = `${user.id}/utility-bill.${utilityFile.name.split(".").pop()}`;

      await uploadFile(idFile, idPath);
      await uploadFile(utilityFile, utilityPath);

      const { error: dbError } = await supabase
        .from("user_verifications")
        .upsert({
          user_id: user.id,
          status: "pending",
          id_number: idNumber.trim(),
          id_document_url: idPath,
          utility_bill_url: utilityPath,
          submitted_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (dbError) throw dbError;

      setStep(4); // success screen
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("Bucket not found") || msg.includes("No such bucket") || msg.includes("bucket")) {
        setError("Storage bucket not configured. Please contact support.");
      } else if (msg.includes("security") || msg.includes("policy") || msg.includes("permission")) {
        setError("Upload permission denied. Please contact support.");
      } else {
        setError(msg || "Upload failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 4) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ee] px-6">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-[#396978] mx-auto mb-6" />
          <h2 className="mb-3 text-3xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Verification Submitted
          </h2>
          <p className="mb-6 text-sm text-[#66737c] leading-relaxed">
            Your documents have been submitted for review. We typically process verifications within 1–2 business days. You'll be notified once your account is verified.
          </p>
          <button
            onClick={() => navigate("/app/dashboard")}
            className="rounded-xl bg-[#396978] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f7f4ee]">
      {/* Left panel */}
      <div className="hidden w-1/2 items-center justify-center bg-[linear-gradient(145deg,_#161106_0%,_#0a0c0e_58%)] md:flex">
        <div className="text-center px-10">
          <div className="flex items-center gap-1 justify-center mb-6">
            <span className="text-[#396978] text-5xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-white/70 text-4xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>GOLD</span>
          </div>
          <p className="text-[#7fb7c9]/70 text-sm font-semibold tracking-[0.35em] mb-10">IDENTITY VERIFICATION</p>
          <div className="space-y-6 text-left">
            {[
              { num: "01", title: "RSA ID Number", desc: "Your 13-digit South African identity number." },
              { num: "02", title: "ID Document", desc: "Photo or scan of your SA ID or passport." },
              { num: "03", title: "Utility Bill", desc: "Recent utility bill as proof of address (not older than 3 months)." },
            ].map((item) => (
              <div key={item.num} className="flex gap-4">
                <span className="text-[#396978] font-bold text-lg mt-0.5">{item.num}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{item.title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-start justify-center bg-[#f7f4ee] px-8 py-10 md:w-1/2 md:items-center">
        <div className="w-full max-w-md">
          {step > 0 ? (
            <button onClick={back} className="mb-8 flex items-center gap-1 text-sm font-bold text-[#7fb7c9] hover:opacity-80">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link to="/app/dashboard" className="mb-8 flex items-center gap-1 text-sm font-bold text-[#7fb7c9] hover:opacity-80">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          )}

          <StepIndicator current={step} />

          {/* Step 0 — ID Number */}
          {step === 0 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Your ID Number</h1>
              <p className="mb-8 text-sm text-[#66737c]">Enter your 13-digit South African identity number exactly as it appears on your ID document.</p>
              <div className="mb-6">
                <label className="block mb-1.5 text-xs font-semibold text-[#22303a] uppercase tracking-wider">RSA ID Number</label>
                <input
                  type="text"
                  maxLength={13}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000000000000"
                  className="w-full rounded-lg border border-[#d1c6b7] bg-white px-4 py-3 text-sm text-[#22303a] tracking-widest placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#396978]/40"
                />
                {idNumber.length > 0 && idNumber.length < 13 && (
                  <p className="mt-1.5 text-xs text-amber-500">{13 - idNumber.length} digits remaining</p>
                )}
              </div>
              <button
                onClick={next}
                disabled={idNumber.length !== 13}
                className="w-full rounded-xl bg-[#396978] py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d] disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 1 — ID Document */}
          {step === 1 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>ID Document</h1>
              <p className="mb-8 text-sm text-[#66737c]">Upload a clear photo or scan of your South African ID book, smart ID card, or passport.</p>
              <FileDropZone
                label="Upload ID Document"
                hint="Drag & drop or click to browse"
                file={idFile}
                onFile={setIdFile}
                accept="image/jpeg,image/png,image/webp,application/pdf"
              />
              <button
                onClick={next}
                disabled={!idFile}
                className="mt-6 w-full rounded-xl bg-[#396978] py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d] disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2 — Utility Bill */}
          {step === 2 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Utility Bill</h1>
              <p className="mb-8 text-sm text-[#66737c]">Upload a recent utility bill (electricity, water, municipal rates) dated within the last 3 months as proof of address.</p>
              <FileDropZone
                label="Upload Utility Bill"
                hint="Drag & drop or click to browse"
                file={utilityFile}
                onFile={setUtilityFile}
                accept="image/jpeg,image/png,image/webp,application/pdf"
              />
              <button
                onClick={next}
                disabled={!utilityFile}
                className="mt-6 w-full rounded-xl bg-[#396978] py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d] disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 3 — Review & Submit */}
          {step === 3 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#162028]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Review & Submit</h1>
              <p className="mb-6 text-sm text-[#66737c]">Please confirm your submission before sending for review.</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between rounded-xl border border-[#d1c6b7] bg-white px-4 py-3">
                  <span className="text-xs font-bold text-[#22303a] tracking-wide">RSA ID NUMBER</span>
                  <span className="text-sm text-[#396978] font-mono tracking-widest">{idNumber}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#d1c6b7] bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#396978]" />
                    <span className="text-xs font-bold text-[#22303a] tracking-wide">ID DOCUMENT</span>
                  </div>
                  <span className="text-xs text-[#66737c] max-w-[160px] truncate">{idFile?.name}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#d1c6b7] bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#396978]" />
                    <span className="text-xs font-bold text-[#22303a] tracking-wide">UTILITY BILL</span>
                  </div>
                  <span className="text-xs text-[#66737c] max-w-[160px] truncate">{utilityFile?.name}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#396978] py-3 text-sm font-bold text-white transition-colors hover:bg-[#2f5b6d] disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Submit for Review"}
              </button>

              <p className="mt-4 text-center text-xs text-[#8d979d]">
                By submitting, you confirm your documents are authentic and consent to identity verification under FICA regulations.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

