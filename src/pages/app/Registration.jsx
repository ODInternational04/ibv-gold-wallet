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
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < current ? "bg-[#2d2a26] text-white" : i === current ? "border-2 border-[#dedbd4] text-[#57534c]" : "border-2 border-[#dedbd4] text-[#57534c]"
            }`}>
              {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`mt-1 text-sm font-semibold tracking-wide ${i === current ? "text-[#57534c]" : "text-[#57534c]"}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 ${i < current ? "bg-[#2d2a26]" : "bg-[#ffffff]"}`} />
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
        dragging ? "border-[#dedbd4] bg-[#ffffff]" : file ? "border-[#dedbd4] bg-[#ffffff]" : "border-[#dedbd4] hover:border-[#dedbd4]"
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="w-10 h-10 text-[#57534c]" />
          <p className="text-base font-semibold text-[#26231f]">{file.name}</p>
          <p className="text-sm text-[#57534c]">{(file.size / 1024).toFixed(0)} KB — click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-10 h-10 text-[#57534c]" />
          <p className="text-base font-semibold text-[#26231f]">{label}</p>
          <p className="text-sm text-[#57534c]">{hint}</p>
          <p className="text-sm text-[#57534c] mt-1">JPG, PNG, PDF — max 10 MB</p>
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
      <div className="flex min-h-screen items-center justify-center bg-[#ffffff] px-6">
        <div className="w-full max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-[#57534c] mx-auto mb-6" />
          <h2 className="mb-3 text-3xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Verification Submitted
          </h2>
          <p className="mb-6 text-base text-[#57534c] leading-relaxed">
            Your documents have been submitted for review. We typically process verifications within 1–2 business days. You'll be notified once your account is verified.
          </p>
          <button
            onClick={() => navigate("/app/dashboard")}
            className="rounded-xl bg-[#2d2a26] px-8 py-3 text-base font-bold text-white transition-colors hover:bg-[#454037]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#ffffff]">
      {/* Left panel */}
      <div className="hidden w-1/2 items-center justify-center bg-white md:flex">
        <div className="text-center px-10">
          <div className="flex items-center gap-1 justify-center mb-6">
            <span className="text-[#57534c] text-5xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>IBV</span>
            <span className="text-[#26231f] text-4xl font-semibold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>GOLD</span>
          </div>
          <p className="text-[#57534c] text-base font-semibold tracking-[0.35em] mb-10">IDENTITY VERIFICATION</p>
          <div className="space-y-6 text-left">
            {[
              { num: "01", title: "RSA ID Number", desc: "Your 13-digit South African identity number." },
              { num: "02", title: "ID Document", desc: "Photo or scan of your SA ID or passport." },
              { num: "03", title: "Utility Bill", desc: "Recent utility bill as proof of address (not older than 3 months)." },
            ].map((item) => (
              <div key={item.num} className="flex gap-4">
                <span className="text-[#57534c] font-bold text-lg mt-0.5">{item.num}</span>
                <div>
                  <p className="text-[#26231f] text-base font-semibold">{item.title}</p>
                  <p className="text-[#57534c] text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-start justify-center bg-[#ffffff] px-8 py-10 md:w-1/2 md:items-center">
        <div className="w-full max-w-md">
          {step > 0 ? (
            <button onClick={back} className="mb-8 flex items-center gap-1 text-base font-bold text-[#57534c] hover:opacity-80">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link to="/app/dashboard" className="mb-8 flex items-center gap-1 text-base font-bold text-[#57534c] hover:opacity-80">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          )}

          <StepIndicator current={step} />

          {/* Step 0 — ID Number */}
          {step === 0 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Your ID Number</h1>
              <p className="mb-8 text-base text-[#57534c]">Enter your 13-digit South African identity number exactly as it appears on your ID document.</p>
              <div className="mb-6">
                <label className="block mb-1.5 text-sm font-semibold text-[#26231f] uppercase tracking-wider">RSA ID Number</label>
                <input
                  type="text"
                  maxLength={13}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="0000000000000"
                  className="w-full rounded-lg border border-[#dedbd4] bg-white px-4 py-3 text-base text-[#26231f] tracking-widest placeholder-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#a47c2e]"
                />
                {idNumber.length > 0 && idNumber.length < 13 && (
                  <p className="mt-1.5 text-sm text-amber-700">{13 - idNumber.length} digits remaining</p>
                )}
              </div>
              <button
                onClick={next}
                disabled={idNumber.length !== 13}
                className="w-full rounded-xl bg-[#2d2a26] py-3 text-base font-bold text-white transition-colors hover:bg-[#454037] disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 1 — ID Document */}
          {step === 1 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>ID Document</h1>
              <p className="mb-8 text-base text-[#57534c]">Upload a clear photo or scan of your South African ID book, smart ID card, or passport.</p>
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
                className="mt-6 w-full rounded-xl bg-[#2d2a26] py-3 text-base font-bold text-white transition-colors hover:bg-[#454037] disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2 — Utility Bill */}
          {step === 2 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Utility Bill</h1>
              <p className="mb-8 text-base text-[#57534c]">Upload a recent utility bill (electricity, water, municipal rates) dated within the last 3 months as proof of address.</p>
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
                className="mt-6 w-full rounded-xl bg-[#2d2a26] py-3 text-base font-bold text-white transition-colors hover:bg-[#454037] disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 3 — Review & Submit */}
          {step === 3 && (
            <>
              <h1 className="mb-2 text-4xl font-semibold text-[#26231f]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Review & Submit</h1>
              <p className="mb-6 text-base text-[#57534c]">Please confirm your submission before sending for review.</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between rounded-xl border border-[#dedbd4] bg-white px-4 py-3">
                  <span className="text-sm font-bold text-[#26231f] tracking-wide">RSA ID NUMBER</span>
                  <span className="text-base text-[#57534c] font-mono tracking-widest">{idNumber}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#dedbd4] bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#57534c]" />
                    <span className="text-sm font-bold text-[#26231f] tracking-wide">ID DOCUMENT</span>
                  </div>
                  <span className="text-sm text-[#57534c] max-w-[160px] truncate">{idFile?.name}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#dedbd4] bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#57534c]" />
                    <span className="text-sm font-bold text-[#26231f] tracking-wide">UTILITY BILL</span>
                  </div>
                  <span className="text-sm text-[#57534c] max-w-[160px] truncate">{utilityFile?.name}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2d2a26] py-3 text-base font-bold text-white transition-colors hover:bg-[#454037] disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Submit for Review"}
              </button>

              <p className="mt-4 text-center text-sm text-[#57534c]">
                By submitting, you confirm your documents are authentic and consent to identity verification under FICA regulations.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

