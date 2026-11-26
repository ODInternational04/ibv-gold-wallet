import React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";

export function PageHeader({
  eyebrow = "IBV GOLD / OPERATIONS",
  title,
  description,
  children,
}) {
  return (
    <header className="admin-page-header">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="admin-description">{description}</p>
      </div>
      <div className="admin-actions">{children}</div>
    </header>
  );
}
export function ErrorMessage({ error }) {
  return error ? (
    <div className="admin-error" role="alert">
      <AlertCircle size={18} />
      <span>{error.message || error}</span>
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="admin-empty" role="status">
      <RefreshCw className="animate-spin" size={22} />
      Loading records…
    </div>
  );
}
export function Empty({ children }) {
  return <div className="admin-empty">{children}</div>;
}
export function Status({ value }) {
  return (
    <span className={`admin-status status-${value}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
export function Field({ label, children, hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
