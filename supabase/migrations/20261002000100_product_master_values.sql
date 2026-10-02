BEGIN;

-- Fail rather than adapt to an unexpected production schema.
DO $preflight$
BEGIN
  IF to_regprocedure('public.has_module_permission(text,text)') IS NULL THEN
    RAISE EXCEPTION 'Expected permission helper is missing';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND data_type = 'text'
        AND (table_name, column_name) IN
          (('products','category'), ('products','base_unit'),
           ('recipes','yield_unit'), ('recipe_ingredients','unit'))) <> 4 THEN
    RAISE EXCEPTION 'Category/unit storage differs from inspected schema';
  END IF;
  IF to_regclass('public.product_master_values') IS NOT NULL THEN
    RAISE EXCEPTION 'product_master_values already exists; inspect before proceeding';
  END IF;
END;
$preflight$;

-- Prevent writes while taking a consistent seed snapshot and installing the guard.
LOCK TABLE public.products, public.recipes, public.recipe_ingredients
  IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE public.product_master_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('category', 'unit')),
  value text NOT NULL CHECK (
    value = regexp_replace(value, '^[[:space:]]+|[[:space:]]+$', '', 'g')
    AND value ~ '[^[:space:]]'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX product_master_values_kind_value_key
  ON public.product_master_values (kind, lower(value));

-- Abort on ambiguous spellings. Never normalize or rewrite historical records.
DO $seed_check$
BEGIN
  IF EXISTS (
    WITH seed(kind, value) AS (
      SELECT 'category', category FROM public.products
      UNION ALL SELECT 'unit', base_unit FROM public.products
      UNION ALL SELECT 'unit', yield_unit FROM public.recipes
      UNION ALL SELECT 'unit', unit FROM public.recipe_ingredients
      UNION ALL SELECT 'unit', value FROM
        (VALUES ('Kg'), ('Gram'), ('Piece'), ('Litre'), ('ml'), ('Pack')) defaults(value)
    )
    SELECT 1 FROM seed GROUP BY kind, lower(btrim(value))
    HAVING count(DISTINCT value) > 1
      OR bool_or(value IS NULL OR value <> regexp_replace(value, '^[[:space:]]+|[[:space:]]+$', '', 'g')
        OR value !~ '[^[:space:]]')
  ) THEN
    RAISE EXCEPTION 'Seed values contain blanks, whitespace or conflicting spellings; inspect first';
  END IF;
END;
$seed_check$;

INSERT INTO public.product_master_values (kind, value)
SELECT 'category', category FROM public.products
UNION SELECT 'unit', base_unit FROM public.products
UNION SELECT 'unit', yield_unit FROM public.recipes
UNION SELECT 'unit', unit FROM public.recipe_ingredients
UNION SELECT 'unit', value FROM
  (VALUES ('Kg'), ('Gram'), ('Piece'), ('Litre'), ('ml'), ('Pack')) defaults(value);

ALTER TABLE public.product_master_values ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_master_values FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.product_master_values TO authenticated;
CREATE POLICY product_master_values_read ON public.product_master_values
  FOR SELECT TO authenticated
  USING (public.has_module_permission('Product Master', 'view')
    OR public.has_module_permission('Product Master', 'add')
    OR public.has_module_permission('Product Master', 'edit')
    OR public.has_module_permission('Product Master', 'delete'));

CREATE FUNCTION public.manage_product_master_value(
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
    WHEN 'deactivate' THEN 'delete' WHEN 'activate' THEN 'edit'
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
      value = CASE WHEN p_action = 'rename' THEN trimmed_value ELSE value END,
      is_active = CASE WHEN p_action = 'deactivate' THEN false
                       WHEN p_action = 'activate' THEN true ELSE is_active END,
      updated_at = clock_timestamp()
      WHERE id = p_id RETURNING * INTO result_value;
  END IF;
  RETURN result_value;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'master_values_duplicate';
END;
$function$;
REVOKE ALL ON FUNCTION public.manage_product_master_value(text,text,uuid,text,timestamptz)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_product_master_value(text,text,uuid,text,timestamptz)
  TO authenticated;

CREATE FUNCTION public.guard_product_master_values() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE
  selected_value public.product_master_values;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.category IS DISTINCT FROM OLD.category THEN
    SELECT * INTO selected_value FROM public.product_master_values
      WHERE kind = 'category' AND value = NEW.category FOR SHARE;
    IF NOT FOUND OR NOT selected_value.is_active THEN
      RAISE EXCEPTION 'master_values_active_category';
    END IF;
  END IF;
  IF TG_OP = 'INSERT' OR NEW.base_unit IS DISTINCT FROM OLD.base_unit THEN
    SELECT * INTO selected_value FROM public.product_master_values
      WHERE kind = 'unit' AND value = NEW.base_unit FOR SHARE;
    IF NOT FOUND OR NOT selected_value.is_active THEN
      RAISE EXCEPTION 'master_values_active_unit';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.guard_product_master_values() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER product_master_values_guard
  BEFORE INSERT OR UPDATE OF category, base_unit ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_master_values();

COMMIT;
