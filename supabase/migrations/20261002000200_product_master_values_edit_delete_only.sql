BEGIN;

-- Keep the existing table, column, Product guard, grants and policies intact.
-- Stop rather than silently reactivate any values added since inspection.
LOCK TABLE public.product_master_values IN SHARE ROW EXCLUSIVE MODE;
DO $preflight$
BEGIN
  IF EXISTS (SELECT 1 FROM public.product_master_values WHERE NOT is_active) THEN
    RAISE EXCEPTION 'Inactive master values exist; inspect before removing activation controls';
  END IF;
END;
$preflight$;

CREATE OR REPLACE FUNCTION public.manage_product_master_value(
  p_action text, p_kind text, p_id uuid DEFAULT NULL,
  p_value text DEFAULT NULL, p_expected_updated_at timestamptz DEFAULT NULL
) RETURNS public.product_master_values
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE
  current_value public.product_master_values;
  result_value public.product_master_values;
  required_permission text;
  value_in_use boolean;
  trimmed_value text;
BEGIN
  required_permission := CASE p_action
    WHEN 'add' THEN 'add' WHEN 'rename' THEN 'edit'
    WHEN 'delete' THEN 'delete' ELSE NULL END;
  IF auth.uid() IS NULL OR required_permission IS NULL
    OR NOT public.has_module_permission('Product Master', required_permission) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'master_values_permission';
  END IF;
  IF p_kind IS NULL OR p_kind NOT IN ('category', 'unit') THEN
    RAISE EXCEPTION 'master_values_kind';
  END IF;
  trimmed_value := regexp_replace(p_value, '^[[:space:]]+|[[:space:]]+$', '', 'g');
  IF p_action IN ('add', 'rename')
    AND (trimmed_value IS NULL OR trimmed_value !~ '[^[:space:]]') THEN
    RAISE EXCEPTION 'master_values_blank';
  END IF;

  -- Same order for every operation. These locks also serialize with ordinary
  -- Product/Recipe/Ingredient writes, including writes through existing services.
  LOCK TABLE public.products, public.recipes, public.recipe_ingredients
    IN SHARE ROW EXCLUSIVE MODE;

  IF p_action = 'add' THEN
    INSERT INTO public.product_master_values (kind, value)
      VALUES (p_kind, trimmed_value) RETURNING * INTO result_value;
    RETURN result_value;
  END IF;

  SELECT * INTO current_value FROM public.product_master_values
    WHERE id = p_id AND kind = p_kind FOR UPDATE;
  IF NOT FOUND OR p_expected_updated_at IS NULL
    OR current_value.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'master_values_stale';
  END IF;

  IF p_action IN ('rename', 'delete') THEN
    SELECT EXISTS (SELECT 1 FROM public.products
      WHERE (p_kind = 'category' AND lower(btrim(category)) = lower(current_value.value))
         OR (p_kind = 'unit' AND lower(btrim(base_unit)) = lower(current_value.value)))
      OR (p_kind = 'unit' AND (
        EXISTS (SELECT 1 FROM public.recipes
          WHERE lower(btrim(yield_unit)) = lower(current_value.value))
        OR EXISTS (SELECT 1 FROM public.recipe_ingredients
          WHERE lower(btrim(unit)) = lower(current_value.value))))
      INTO value_in_use;
    IF value_in_use THEN RAISE EXCEPTION 'master_values_in_use'; END IF;
  END IF;

  IF p_action = 'delete' THEN
    DELETE FROM public.product_master_values WHERE id = p_id RETURNING * INTO result_value;
  ELSE
    UPDATE public.product_master_values SET
      value = trimmed_value,
      updated_at = clock_timestamp()
      WHERE id = p_id RETURNING * INTO result_value;
  END IF;
  RETURN result_value;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'master_values_duplicate';
END;
$function$;

COMMIT;
