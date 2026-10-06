import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, Check, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getReaderAssignment, getReaderPrintData, listMyReaderAssignments, markReaderAssignmentRead, readerError } from "../services/recipeReaderService";
import { printReaderRecipe } from "../utils/recipeReaderPdf";
import "../styles/RecipeReaders.css";

export default function RecipeReaders({ embedded = false }) {
  const { assignmentId } = useParams();
  const { t, i18n } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const mounted = useRef(false);
  const pending = useRef(false);
  const owner = `${profile?.id}:${assignmentId || "list"}`;
  const currentOwner = useRef(owner);
  useLayoutEffect(() => { currentOwner.current = owner; pending.current = false; setBusy(false); }, [owner]);
  const [dataOwner, setDataOwner] = useState("");

  const load = useCallback(async () => {
    const ticket = ++request.current;
    const current = () => mounted.current && ticket === request.current && currentOwner.current === owner;
    try {
      const result = assignmentId ? await getReaderAssignment(assignmentId) : await listMyReaderAssignments();
      if (current()) { setData(result); setDataOwner(owner); setError(""); }
    } catch (loadError) { if (current()) { setData(null); setDataOwner(owner); setError(readerError(loadError, t)); } }
  }, [assignmentId, owner, t]);
  useEffect(() => {
    mounted.current = true; load();
    const refresh = () => { if (document.visibilityState === "visible") { refreshProfile(); load(); } };
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { mounted.current = false; ++request.current; window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load, refreshProfile]);

  const perform = async (print) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); ++request.current;
    try {
      await refreshProfile();
      if (!mounted.current || currentOwner.current !== owner) return;
      if (print) {
        const recipe = await getReaderPrintData(assignmentId);
        if (mounted.current && currentOwner.current === owner) await printReaderRecipe(recipe, t, i18n.language);
      } else {
        await markReaderAssignmentRead(assignmentId);
        if (mounted.current && currentOwner.current === owner) await load();
      }
    } catch (actionError) { if (mounted.current && currentOwner.current === owner) { setError(readerError(actionError, t)); setData(null); } }
    finally { pending.current = false; if (mounted.current && currentOwner.current === owner) setBusy(false); }
  };
  const date = (value) => value ? new Date(value).toLocaleString(i18n.language) : t("recipeReaders.unread");
  const typeName = (item) => (i18n.language.startsWith("ar") ? item.type_arabic_name : item.type_name) || item.product_type || "-";
  const currentData = dataOwner === owner ? data : null;

  return <div className="reader-page">
    {!embedded && <h1>{t(assignmentId ? "recipeReaders.recipe" : "recipeReaders.assignedToMe")}</h1>}
    {assignmentId && <Link to="/recipes?tab=assigned" className="reader-back">{t("recipeReaders.back")}</Link>}
    {error && <p role="alert" className="reader-error">{error}</p>}
    {!currentData && !error && <p role="status">{t("common.loading")}</p>}
    {!assignmentId && currentData && <section className="reader-card"><div className="reader-table-scroll"><table className="reader-table"><thead><tr><th>{t("recipeReaders.code")}</th><th>{t("recipeReaders.name")}</th><th>{t("recipeReaders.assignedBy")}</th><th>{t("recipeReaders.assignedAt")}</th><th>{t("recipeReaders.assignmentStatus")}</th><th>{t("recipeReaders.readAt")}</th><th>{t("recipeReaders.actions")}</th></tr></thead><tbody>
      {currentData.map((item) => <tr key={item.id}><td>{item.recipe_code}</td><td>{item.name}</td><td>{item.assigned_by_name}</td><td>{date(item.assigned_at)}</td><td>{t(item.read_at ? "recipeReaders.read" : "recipeReaders.unread")}</td><td>{date(item.read_at)}</td><td>{item.available ? <Link className="reader-secondary" to={`/recipes/reader/${item.id}`}><BookOpen size={16} />{t("recipeReaders.open")}</Link> : <span>{t("recipeReaders.awaitingApproval")}</span>}</td></tr>)}
    </tbody></table></div>{!currentData.length && <p>{t("recipeReaders.noMine")}</p>}</section>}
    {assignmentId && currentData && <section className="reader-card">
      <header className="reader-details-header"><div><span>{currentData.recipe_code}</span><h2>{currentData.name}</h2><p>{t("recipeReaders.readOnly")}</p></div>
        <div className="reader-actions"><button type="button" className="reader-primary" disabled={busy || Boolean(currentData.read_at)} onClick={() => perform(false)}><Check size={16} />{t(currentData.read_at ? "recipeReaders.read" : "recipeReaders.markRead")}</button><button type="button" className="reader-secondary" disabled={busy} onClick={() => perform(true)}><Printer size={16} />{t("recipeReaders.print")}</button></div>
      </header>
      <p className="reader-description">{currentData.description || "-"}</p>
      <dl className="reader-facts"><div><dt>{t("recipeReaders.type")}</dt><dd>{typeName(currentData)}</dd></div><div><dt>{t("recipeReaders.category")}</dt><dd>{currentData.category}</dd></div><div><dt>{t("recipeReaders.yield")}</dt><dd>{currentData.yield_quantity} {currentData.yield_unit}</dd></div><div><dt>{t("recipeReaders.assignedBy")}</dt><dd>{currentData.assigned_by_name}</dd></div><div><dt>{t("recipeReaders.assignedAt")}</dt><dd>{date(currentData.assigned_at)}</dd></div><div><dt>{t("recipeReaders.readAt")}</dt><dd>{date(currentData.read_at)}</dd></div></dl>
      <div className="reader-table-scroll"><table className="reader-table"><thead><tr><th>{t("recipeReaders.ingredient")}</th><th>{t("recipeReaders.type")}</th><th>{t("recipeReaders.quantity")}</th><th>{t("recipeReaders.unit")}</th></tr></thead><tbody>{currentData.ingredients.map((item) => <tr key={item.id}><td>{item.name}</td><td>{typeName(item)}</td><td>{item.quantity}</td><td>{item.unit}</td></tr>)}</tbody></table></div>
    </section>}
  </div>;
}
