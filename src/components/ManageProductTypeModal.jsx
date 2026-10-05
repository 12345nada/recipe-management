import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { manageProductType, productTypeError } from "../services/productTypesService";

export default function ManageProductTypeModal({ action, item, canAdd, canEdit, canDelete, beforeAction, onChange, onClose }) {
  const { t } = useTranslation();
  const text = (key) => t(`settingsPage.productTypeManagement.${key}`);
  const [fields, setFields] = useState({ name: item?.value || "", arabicName: item?.arabic_name || "",
    ingredient: item?.allows_ingredient ?? "", recipes: item?.allows_recipe_product ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(true);
  const modal = useRef(null);
  const confirmationOnly = action === "delete" || action === "retire";
  const allowed = action === "add" ? canAdd : action === "edit" ? canEdit : confirmationOnly && canDelete;
  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement;
    modal.current?.focus();
    return () => { mounted.current = false; previous?.focus(); };
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    if (!allowed || pending.current) return;
    if (!confirmationOnly && (!fields.name.trim() || !fields.arabicName.trim())) { setError(text("blank")); return; }
    if (!confirmationOnly && (typeof fields.ingredient !== "boolean" || typeof fields.recipes !== "boolean")) { setError(text("configuration")); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      const authorization = beforeAction ? await beforeAction(action) : null;
      if (beforeAction && (!authorization || !mounted.current)) return;
      const result = await manageProductType(action, item, fields);
      if (!mounted.current || (authorization && !authorization.isCurrent())) return;
      onChange(action, result); onClose();
    }
    catch (operationError) { if (mounted.current) setError(productTypeError(operationError, t)); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const keys = (event) => {
    if (event.key === "Escape") { event.preventDefault(); if (!busy) onClose(); }
    if (event.key !== "Tab") return;
    const controls = [...modal.current.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled)")];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && [first, modal.current].includes(document.activeElement)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return createPortal(<div className="product-modal-overlay product-values-overlay" onClick={() => { if (!busy) onClose(); }}>
    <div className={`product-modal product-values-modal${!confirmationOnly ? " product-type-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="product-type-title"
      ref={modal} tabIndex={-1} onKeyDown={keys} onClick={(event) => event.stopPropagation()}>
      <div className="product-modal-header"><h2 id="product-type-title">{text(action)}</h2>
        <button type="button" className="product-modal-close" disabled={busy} onClick={onClose} aria-label={t("common.close")}><X size={18} /></button></div>
      <form onSubmit={submit}>
        {confirmationOnly ? <p>{t(`settingsPage.productTypeManagement.${action === "retire" ? "confirmRetire" : "confirmDelete"}`, { name: item.value })}</p> : <div className="product-form-grid product-type-fields">
          {[["name", "name"], ["arabicName", "arabicName"]].map(([field, key]) => <div className="product-form-group" key={field}>
            <label htmlFor={`type-${field}`}>{text(key)} <span>*</span></label>
            <input id={`type-${field}`} required disabled={busy || !allowed} value={fields[field]} dir={field === "arabicName" ? "rtl" : undefined}
              onChange={(event) => { setFields((current) => ({ ...current, [field]: event.target.value })); setError(""); }} />
          </div>)}
          {[["ingredient", "ingredient"], ["recipes", "recipes"]].map(([field, key]) => <div className="product-form-group" key={field}>
            <label htmlFor={`type-${field}`}>{text(key)} <span>*</span></label>
            <select id={`type-${field}`} required disabled={busy || !allowed} value={fields[field] === "" ? "" : String(fields[field])}
              onChange={(event) => { setFields((current) => ({ ...current, [field]: event.target.value === "true" })); setError(""); }}>
              <option value="" disabled>{text("choose")}</option><option value="true">{text("yes")}</option><option value="false">{text("no")}</option>
            </select>
          </div>)}
        </div>}
        {error && <p className="product-values-error" role="alert">{error}</p>}
        <div className="product-modal-actions"><button type="button" className="product-cancel-button" disabled={busy} onClick={onClose}>{t("common.cancel")}</button>
          {allowed && <button type="submit" className="product-save-button" disabled={busy}>{text(confirmationOnly ? action : "save")}</button>}</div>
      </form>
    </div>
  </div>, document.body);
}
