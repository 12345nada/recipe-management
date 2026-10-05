import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";
import { getProductTypes } from "../services/productTypesService";
import { supabase } from "../lib/supabaseClient";

const ProductTypesContext = createContext(null);
const EMPTY_TYPES = [];

export function ProductTypesProvider({ children }) {
  const { profile } = useAuth();
  const { i18n } = useTranslation();
  const owner = `${profile?.id || ""}:${profile?.role_id || ""}`;
  const ownerRef = useRef(owner);
  const request = useRef(0);
  const pending = useRef(null);
  const mounted = useRef(false);
  const [state, setState] = useState({ owner: null, types: [], status: "loading", error: null });
  const refresh = useCallback(async (force = true) => {
    if (!profile?.id || !mounted.current || ownerRef.current !== owner) return;
    if (!force && pending.current?.owner === owner) return;
    const id = ++request.current;
    pending.current = { owner, id };
    setState((current) => ({ owner, types: current.owner === owner ? current.types : [], status: "loading", error: null }));
    const currentRequest = () => mounted.current && ownerRef.current === owner && request.current === id;
    try {
      const types = await getProductTypes();
      if (currentRequest()) setState({ owner, types, status: "ready", error: null });
    } catch (error) {
      if (currentRequest()) setState({ owner, types: [], status: "error", error });
    } finally {
      if (currentRequest()) pending.current = null;
    }
  }, [owner, profile?.id]);

  useEffect(() => {
    mounted.current = true;
    const load = () => refresh(false);
    load();
    if (!profile?.id) return () => { mounted.current = false; ++request.current; pending.current = null; };
    const channel = supabase.channel(`product-types-${profile.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "product_master_values", filter: "kind=eq.product_type" }, load)
      .subscribe();
    // Refresh in other tabs and after returning to a screen, even if this table
    // is not included in the project's realtime publication.
    window.addEventListener("focus", load);
    return () => { mounted.current = false; ++request.current; pending.current = null; window.removeEventListener("focus", load); supabase.removeChannel(channel); };
  }, [owner, profile?.id, refresh]);

  const status = state.owner === owner ? state.status : "loading";
  const ready = status === "ready";
  const loading = status === "loading";
  const error = status === "error" ? state.error : null;
  const types = ready ? state.types : EMPTY_TYPES;
  const activeTypes = useMemo(() => types.filter((item) => item.is_active === true), [types]);
  const canCreateRecipe = useCallback((key) => ready
    ? activeTypes.some((item) => item.type_key === key && item.allows_recipe_product) : null,
  [activeTypes, ready]);
  const canUseIngredient = useCallback((key) => ready
    ? activeTypes.some((item) => item.type_key === key && item.allows_ingredient) : null,
  [activeTypes, ready]);
  const readiness = useRef(null);
  useLayoutEffect(() => {
    ownerRef.current = owner;
    readiness.current = { owner, ready, request: request.current };
  }, [owner, ready]);
  const isReady = useCallback(() => mounted.current && ownerRef.current === owner
    && readiness.current.owner === owner && readiness.current.ready
    && readiness.current.request === request.current, [owner]);

  const label = useCallback((key) => {
    const type = types.find((item) => item.type_key === key);
    if (!ready) return "";
    if (!type) return key?.startsWith("custom:") ? "-" : key || "-";
    return i18n.language.startsWith("ar") ? type.arabic_name : type.value;
  }, [types, ready, i18n.language]);
  const searchText = useCallback((key) => {
    const item = types.find((type) => type.type_key === key);
    return item ? `${item.value} ${item.arabic_name}` : label(key);
  }, [types, label]);
  // Unknown metadata is not a negative business value. Callers must wait for ready.
  const allowsRecipes = useCallback((key) => ready ? types.some((item) => item.type_key === key && item.allows_recipe_product) : null, [types, ready]);
  const allowsIngredient = useCallback((key) => ready ? types.some((item) => item.type_key === key && item.allows_ingredient) : null, [types, ready]);
  const changed = useCallback((action, item) => {
    if (!mounted.current || ownerRef.current !== owner) return;
    ++request.current; // Invalidate every response started before this mutation.
    pending.current = null;
    setState((current) => ({ ...current, types: action === "delete"
      ? current.types.filter((type) => type.id !== item.id)
      : current.types.some((type) => type.id === item.id)
        ? current.types.map((type) => type.id === item.id ? item : type) : [...current.types, item] }));
    return refresh();
  }, [owner, refresh]);

  return <ProductTypesContext.Provider value={{ types, activeTypes, canCreateRecipe, canUseIngredient, label, searchText, allowsRecipes, allowsIngredient, changed, loading, error, status, ready, isReady, refresh }}>
    {children}
  </ProductTypesContext.Provider>;
}

export function useProductTypes() {
  const value = useContext(ProductTypesContext);
  if (!value) throw new Error("ProductTypesProvider is required");
  return value;
}
