import { supabase } from "../lib/supabaseClient";

export async function getProductTypes() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("product_master_values")
      .select("id,value,arabic_name,type_key,allows_ingredient,allows_recipe_product,is_system_type,updated_at")
      .eq("kind", "product_type").order("created_at").order("id").range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

export async function manageProductType(action, item, fields) {
  const { data, error } = await supabase.rpc("manage_product_type", {
    p_action: action, p_id: item?.id ?? null,
    p_name: fields?.name?.trim() ?? null,
    p_arabic_name: fields?.arabicName?.trim() ?? null,
    p_allows_ingredient: fields?.ingredient ?? null,
    p_allows_recipe_product: fields?.recipes ?? null,
    p_expected_updated_at: item?.updated_at ?? null,
  });
  if (error) throw error;
  return data;
}

export function productTypeError(error, t) {
  const key = {
    product_type_blank: "blank", product_type_duplicate: "duplicate",
    product_type_stale: "stale", product_type_permission: "permission",
    product_type_in_use: "inUse", product_type_protected: "protected",
    product_type_ingredient_in_use: "ingredientInUse",
    product_type_recipe_in_use: "recipeInUse", product_type_configuration: "configuration",
  }[error?.message] || "failed";
  return t(`settingsPage.productTypeManagement.${key}`);
}
