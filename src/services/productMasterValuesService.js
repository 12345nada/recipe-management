import { supabase } from "../lib/supabaseClient";

export async function getProductMasterValues() {
  // Supabase caps each response; page rather than silently truncating options.
  const values = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("product_master_values")
      .select("id,kind,value,is_active,created_at,updated_at")
      .order("kind").order("value").order("id").range(from, from + 999);
    if (error) throw error;
    values.push(...data);
    if (data.length < 1000) return values;
  }
}

export async function manageProductMasterValue(action, kind, item, value) {
  const { data, error } = await supabase.rpc("manage_product_master_value", {
    p_action: action,
    p_kind: kind,
    p_id: item?.id ?? null,
    p_value: value?.trim() ?? null,
    p_expected_updated_at: item?.updated_at ?? null,
  });
  if (error) throw error;
  return data;
}

export function productMasterValueError(error, t) {
  const keys = {
    master_values_blank: "blank",
    master_values_duplicate: "duplicate",
    master_values_in_use: "inUse",
    master_values_stale: "stale",
    master_values_permission: "permission",
    master_values_active_category: "activeRequired",
    master_values_active_unit: "activeRequired",
  };
  return t(`productMasterPage.management.${keys[error?.message] || "failed"}`);
}
