import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { manageProductMasterValue, productMasterValueError } from "../services/productMasterValuesService";

export default function ManageProductMasterValuesModal({ kind, values, canAdd, canEdit, canDelete, beforeAction, onChange, onClose, initialAction, initialItem }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialAction === "rename" ? initialItem.value : "");
  const [editing, setEditing] = useState(initialAction === "rename" ? initialItem : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(initialAction === "delete" ? initialItem : null);
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const pendingRef = useRef(false);
  const mounted = useRef(true);
  const label = (key) => t(`productMasterPage.management.${key}`);

  useEffect(() => {
    mounted.current = true;
    const previousFocus = document.activeElement;
    modalRef.current?.focus();
    return () => { mounted.current = false; previousFocus?.focus(); };
  }, []);

  const perform = async (action, item, proposedValue) => {
    const allowed = action === "add" ? canAdd
      : action === "rename" ? canEdit
      : action === "delete" ? canDelete : false;
    if (!allowed || pendingRef.current) return;
    if (["add", "rename"].includes(action) && !proposedValue.trim()) {
      setError(label("blank"));
      inputRef.current?.focus();
      return;
    }
    pendingRef.current = true;
    setBusy(true);
    setError("");
    try {
      const authorization = beforeAction ? await beforeAction(action) : null;
      if (beforeAction && (!authorization || !mounted.current)) return;
      const changed = await manageProductMasterValue(action, kind, item, proposedValue);
      if (!mounted.current || (authorization && !authorization.isCurrent())) return;
      onChange(action, changed);
      setEditing(null);
      setValue("");
      setConfirmDelete(null);
    } catch (operationError) {
      if (mounted.current) setError(productMasterValueError(operationError, t));
    } finally {
      pendingRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const handleKeys = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!busy) onClose();
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(modalRef.current.querySelectorAll("button:not(:disabled), input:not(:disabled)"));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  };

  return createPortal(
    <div className="product-modal-overlay product-values-overlay" onClick={() => { if (!busy) onClose(); }}>
      <div className="product-modal product-values-modal" role="dialog" aria-modal="true"
        aria-labelledby="product-values-title" tabIndex={-1} ref={modalRef}
        onKeyDown={handleKeys} onClick={(event) => event.stopPropagation()}>
        <div className="product-modal-header">
          <div><h2 id="product-values-title">{label(kind === "category" ? "categories" : "units")}</h2></div>
          <button type="button" className="product-modal-close" disabled={busy} onClick={onClose} aria-label={label("close")}><X size={18} /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); perform(editing ? "rename" : "add", editing, value); }}>
          {(canAdd || editing) && <div className="product-form-group">
            <label htmlFor="product-value-name">{label(editing ? "editValue" : "newValue")}</label>
            <input id="product-value-name" ref={inputRef} value={value} disabled={busy}
              onChange={(event) => { setValue(event.target.value); setError(""); }} />
            <div className="product-values-buttons">
              {editing && <button type="button" className="product-cancel-button" disabled={busy}
                onClick={() => { setEditing(null); setValue(""); setError(""); }}>{t("common.cancel")}</button>}
              <button type="submit" className="product-save-button" disabled={busy}>
                {editing ? <Pencil size={14} /> : <Plus size={14} />}{label(editing ? "save" : "add")}
              </button>
            </div>
          </div>}
          {error && <p className="product-values-error" role="alert">{error}</p>}
          <div className="product-values-list">
            {values.filter((item) => item.kind === kind).map((item) => <div className="product-values-row" key={item.id}>
              <span>{item.value}</span>
              <div className="product-values-buttons">
                {canEdit && <button type="button" className="product-cancel-button" disabled={busy}
                  aria-label={`${label("editValue")}: ${item.value}`} onClick={() => {
                    setEditing(item); setValue(item.value); setError(""); setConfirmDelete(null); inputRef.current?.focus();
                  }}><Pencil size={14} /></button>}
                {canDelete && <button type="button" className="product-cancel-button" disabled={busy}
                  aria-label={`${label("delete")}: ${item.value}`} onClick={() => { setConfirmDelete(item); setError(""); }}><Trash2 size={14} /></button>}
              </div>
            </div>)}
          </div>
          {confirmDelete && <div className="product-values-confirm">
            <p>{t("productMasterPage.management.confirmDelete", { value: confirmDelete.value })}</p>
            <div className="product-values-buttons">
              <button type="button" className="product-cancel-button" disabled={busy} onClick={() => setConfirmDelete(null)}>{t("common.cancel")}</button>
              <button type="button" className="product-save-button" disabled={busy} onClick={() => perform("delete", confirmDelete)}>{label("delete")}</button>
            </div>
          </div>}
          <div className="product-modal-actions"><button type="button" className="product-cancel-button" disabled={busy} onClick={onClose}>{label("close")}</button></div>
        </form>
      </div>
    </div>, document.body,
  );
}
