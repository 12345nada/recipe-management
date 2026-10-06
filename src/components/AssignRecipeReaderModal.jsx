import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, UserPlus } from "lucide-react";
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
  return <div className="reader-modal-overlay"><section className="reader-modal" role="dialog" aria-modal="true" aria-labelledby="reader-assignment-title">
    <header><h2 id="reader-assignment-title">{t("recipeReaders.assignments")}</h2><button type="button" className="reader-icon" disabled={busy} onClick={onClose} aria-label={t("common.close")}><X size={20} /></button></header>
    <div className="reader-modal-body"><p>{recipe.productName}</p>
      {loading ? <p role="status">{t("common.loading")}</p> : <>
        {canAdd && <div className="reader-assign-controls">
          <input aria-label={t("recipeReaders.searchUsers")} placeholder={t("recipeReaders.searchUsers")} value={search} onChange={(event) => setSearch(event.target.value)} disabled={busy} />
          <select aria-label={t("recipeReaders.chooseUser")} value={selected} onChange={(event) => setSelected(event.target.value)} disabled={busy}>
            <option value="">{t("recipeReaders.chooseUser")}</option>{filtered.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.username})</option>)}
          </select><button type="button" className="reader-primary" disabled={!selected || busy} onClick={() => perform(() => assignReader(recipe.id, selected, recipe.updatedAt))}><UserPlus size={16} />{t("recipeReaders.assign")}</button>
        </div>}
        <div className="reader-table-scroll"><table className="reader-table"><thead><tr><th>{t("recipeReaders.reader")}</th><th>{t("recipeReaders.assignedBy")}</th><th>{t("recipeReaders.assignedAt")}</th><th>{t("recipeReaders.readAt")}</th><th>{t("recipeReaders.assignmentStatus")}</th><th>{t("recipeReaders.actions")}</th></tr></thead>
          <tbody>{assignments.map((item) => <tr key={item.id}><td>{item.assigned_user_name}</td><td>{item.assigned_by_name}</td><td>{date(item.assigned_at)}</td><td>{date(item.read_at)}</td><td>{t(`recipeReaders.${item.revoked_at ? "revoked" : "active"}`)}</td><td>{canRevoke && !item.revoked_at && <button type="button" className="reader-secondary" disabled={busy} onClick={() => { if (window.confirm(t("recipeReaders.revokePrompt", { name: item.assigned_user_name }))) perform(() => revokeReaderAssignment(item.id)); }}>{t("recipeReaders.revoke")}</button>}</td></tr>)}</tbody></table></div>
        {!assignments.length && <p>{t("recipeReaders.noAssignments")}</p>}
      </>}
      {error && <p className="reader-error" role="alert">{error}</p>}
    </div><footer><button type="button" className="reader-secondary" disabled={busy} onClick={onClose}>{t("common.close")}</button></footer>
  </section></div>;
}
