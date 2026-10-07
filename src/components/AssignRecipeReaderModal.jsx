import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, UserPlus, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { assignReader, listReaderCandidates, listReaderAssignments, readerError, revokeReaderAssignment } from "../services/recipeReaderService";
import "../styles/RecipeReaders.css";

export default function AssignRecipeReaderModal({ recipe, onClose }) {
  const { t, i18n } = useTranslation();
  const { profile, hasPermission, refreshProfile } = useAuth();
  const canView = hasPermission("Recipes", "view") && hasPermission("Recipe Reader Assignments", "view");
  const canAdd = canView && hasPermission("Recipe Reader Assignments", "add")
    && ["Approved", "ERP Pending", "ERP Completed"].includes(recipe.status);
  const canRevoke = canView && hasPermission("Recipe Reader Assignments", "delete");
  const [candidates, setCandidates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const picker = useRef(null);
  const pickerButton = useRef(null);
  const pickerSearch = useRef(null);
  const dialog = useRef(null);
  useLayoutEffect(() => {
    const shell = document.querySelector(".main-layout");
    if (!shell) return;
    const previousFocus = document.activeElement;
    const previous = { overflow: shell.style.overflowY, padding: shell.style.paddingInlineEnd, inert: shell.inert };
    const scrollbar = shell.offsetWidth - shell.clientWidth;
    shell.style.paddingInlineEnd = `${parseFloat(getComputedStyle(shell).paddingInlineEnd) + scrollbar}px`;
    shell.style.overflowY = "hidden";
    shell.inert = true;
    dialog.current?.focus({ preventScroll: true });
    return () => {
      shell.style.overflowY = previous.overflow;
      shell.style.paddingInlineEnd = previous.padding;
      shell.inert = previous.inert;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (!pickerOpen) return;
    pickerSearch.current?.focus();
    const outside = (event) => { if (!picker.current?.contains(event.target)) setPickerOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [pickerOpen]);
  useEffect(() => {
    const option = picker.current?.querySelector('[aria-selected="true"]');
    const list = option?.parentElement;
    if (!list) return;
    const top = option.getBoundingClientRect().top - list.getBoundingClientRect().top;
    if (top < 0) list.scrollTop += top;
    else if (top + option.offsetHeight > list.clientHeight) list.scrollTop += top + option.offsetHeight - list.clientHeight;
  }, [activeOption]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const request = useRef(0);
  const mounted = useRef(false);
  const owner = `${profile?.id}:${profile?.role_id}`;
  const currentOwner = useRef(owner);
  useLayoutEffect(() => { currentOwner.current = owner; }, [owner]);
  const actionPending = useRef(false);

  const load = useCallback(async () => {
    const ticket = ++request.current;
    const current = () => mounted.current && ticket === request.current && currentOwner.current === owner;
    try {
      const [rows, users] = await Promise.all([listReaderAssignments(recipe.id),
        canAdd ? listReaderCandidates(recipe.id) : Promise.resolve([])]);
      if (current()) { setAssignments(rows); setCandidates(users); setError(""); }
    } catch (loadError) { if (current()) setError(readerError(loadError, t)); }
    finally { if (current()) setLoading(false); }
  }, [recipe.id, canAdd, owner, t]);

  useEffect(() => {
    mounted.current = true;
    if (canView) load();
    const refresh = () => { if (document.visibilityState === "visible") { refreshProfile(); load(); } };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { mounted.current = false; ++request.current; window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [canView, load, refreshProfile]);

  useEffect(() => { if (!canView) onClose(); }, [canView, onClose]);
  const perform = async (action) => {
    if (actionPending.current) return;
    actionPending.current = true; setBusy(true); setError("");
    ++request.current;
    try {
      await refreshProfile();
      if (!mounted.current || currentOwner.current !== owner) return;
      await action(); // RPC independently checks the latest View + action permissions.
      if (!mounted.current || currentOwner.current !== owner) return;
      setSelected(""); await load();
    } catch (actionError) { if (mounted.current && currentOwner.current === owner) setError(readerError(actionError, t)); }
    finally { actionPending.current = false; if (mounted.current && currentOwner.current === owner) setBusy(false); }
  };
  const date = (value) => value ? new Date(value).toLocaleString(i18n.language) : t("recipeReaders.unread");
  const activeUsers = new Set(assignments.filter((item) => !item.revoked_at).map((item) => item.assigned_user_id));
  const filtered = candidates.filter((user) => !activeUsers.has(user.id) && `${user.name} ${user.username}`.toLowerCase().includes(search.toLowerCase()));

  if (!canView) return null;
  return createPortal(<div className="reader-modal-overlay" onPointerDown={(event) => {
    event.stopPropagation();
    if (event.target === event.currentTarget) { event.preventDefault(); setPickerOpen(false); }
  }} onMouseDown={(event) => {
    event.stopPropagation();
    if (event.target === event.currentTarget) event.preventDefault();
  }} onClick={(event) => event.stopPropagation()}>
    <section ref={dialog} tabIndex={-1} className="reader-modal" role="dialog" aria-modal="true" aria-labelledby="reader-assignment-title" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')].filter((node) => node.tabIndex >= 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus({ preventScroll: true }); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus({ preventScroll: true }); }
    }}>
    <header><h2 id="reader-assignment-title">{t("recipeReaders.assignments")}</h2><button type="button" className="reader-icon" disabled={busy} onClick={onClose} aria-label={t("common.close")}><X size={20} /></button></header>
    <div className="reader-modal-body"><p>{recipe.productName}</p>
      {loading ? <p role="status">{t("common.loading")}</p> : <>
        {canAdd && <div className="reader-assign-controls">
          <div className="reader-picker" ref={picker} onKeyDown={(event) => {
            if (event.key === "Escape") { event.stopPropagation(); setPickerOpen(false); pickerButton.current?.focus(); }
          }}>
            <button ref={pickerButton} type="button" className="reader-picker-trigger" aria-label={t("recipeReaders.chooseUser")} aria-haspopup="listbox" aria-expanded={pickerOpen} disabled={busy} onClick={() => { setSearch(""); setActiveOption(0); setPickerOpen(!pickerOpen); }} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setPickerOpen(true); setActiveOption(0); } }}>
              <span>{candidates.find((user) => user.id === selected)?.name || t("recipeReaders.chooseUser")}</span><ChevronDown size={16} />
            </button>
            {pickerOpen && <div className="reader-picker-menu">
              <input ref={pickerSearch} role="combobox" aria-expanded="true" aria-controls="reader-candidate-options" aria-activedescendant={filtered[activeOption] ? `reader-option-${activeOption}` : undefined} aria-label={t("recipeReaders.searchUsers")} placeholder={t("recipeReaders.searchUsers")} value={search} onChange={(event) => { setSearch(event.target.value); setActiveOption(0); }} onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActiveOption((index) => Math.max(0, Math.min(filtered.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))); }
                if (event.key === "Enter" && filtered[activeOption]) { event.preventDefault(); setSelected(filtered[activeOption].id); setPickerOpen(false); pickerButton.current?.focus(); }
              }} />
              <div id="reader-candidate-options" role="listbox" aria-label={t("recipeReaders.chooseUser")}>
                {filtered.map((user, index) => <button type="button" role="option" id={`reader-option-${index}`} aria-selected={index === activeOption} tabIndex={-1} key={user.id} onClick={() => { setSelected(user.id); setPickerOpen(false); pickerButton.current?.focus(); }}>{user.name}</button>)}
                {!filtered.length && <p role="status">{t("recipeReaders.noMatchingUsers")}</p>}
              </div>
            </div>}
          </div><button type="button" className="reader-primary" disabled={!selected || busy} onClick={() => { setPickerOpen(false); perform(() => assignReader(recipe.id, selected, recipe.updatedAt)); }}><UserPlus size={16} />{t("recipeReaders.assign")}</button>
        </div>}
        <div className="reader-table-scroll"><table className="reader-table"><thead><tr><th>{t("recipeReaders.reader")}</th><th>{t("recipeReaders.assignedBy")}</th><th>{t("recipeReaders.assignedAt")}</th><th>{t("recipeReaders.readAt")}</th><th>{t("recipeReaders.assignmentStatus")}</th><th>{t("recipeReaders.actions")}</th></tr></thead>
          <tbody>{assignments.map((item) => <tr key={item.id}><td>{item.assigned_user_name}</td><td>{item.assigned_by_name}</td><td>{date(item.assigned_at)}</td><td>{date(item.read_at)}</td><td>{t(`recipeReaders.${item.revoked_at ? "revoked" : "active"}`)}</td><td>{canRevoke && !item.revoked_at && <button type="button" className="reader-secondary" disabled={busy} onClick={() => { if (window.confirm(t("recipeReaders.revokePrompt", { name: item.assigned_user_name }))) perform(() => revokeReaderAssignment(item.id)); }}>{t("recipeReaders.revoke")}</button>}</td></tr>)}</tbody></table></div>
        {!assignments.length && <p>{t("recipeReaders.noAssignments")}</p>}
      </>}
      {error && <p className="reader-error" role="alert">{error}</p>}
    </div><footer><button type="button" className="reader-secondary" disabled={busy} onClick={onClose}>{t("common.close")}</button></footer>
  </section></div>, document.body);
}
