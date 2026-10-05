-- LOCAL ONLY. Installation changes no application/master rows or sequence states.
BEGIN;
LOCK TABLE public.products,public.recipes,public.recipe_ingredients,public.product_master_values IN SHARE ROW EXCLUSIVE MODE;
DO $preflight$
BEGIN
  IF md5(pg_get_functiondef('public.guard_product_type_metadata()'::regprocedure)) <> 'd59326786d2e9928846d3ea759f3f408' THEN RAISE EXCEPTION 'Unexpected inspected function: guard_product_type_metadata()'; END IF;
  IF md5(pg_get_functiondef('public.guard_product_type_relationship()'::regprocedure)) <> 'a5b0332dd948b3f92fcec11a80d8f5fa' THEN RAISE EXCEPTION 'Unexpected inspected function: guard_product_type_relationship()'; END IF;
  IF md5(pg_get_functiondef('public.generate_product_code()'::regprocedure)) <> '7ee7410a824863c5b00ec496880b1d3f' THEN RAISE EXCEPTION 'Unexpected inspected function: generate_product_code()'; END IF;
  IF md5(pg_get_functiondef('public.manage_product_type(text,uuid,text,text,boolean,boolean,timestamptz)'::regprocedure)) <> '952f6801a60ffb9557b9fee0439e70e8' THEN RAISE EXCEPTION 'Unexpected inspected function: manage_product_type(text,uuid,text,text,boolean,boolean,timestamptz)'; END IF;
  IF (SELECT count(*) FROM pg_trigger WHERE tgrelid='public.recipe_ingredients'::regclass
      AND tgname='ingredient_product_type_guard' AND NOT tgisinternal
      AND md5(pg_get_triggerdef(oid))='c9c3361730149cf8a750a99abaf7dc4f') <> 1 THEN
    RAISE EXCEPTION 'Unexpected inspected ingredient Product Type trigger';
  END IF;
  IF (SELECT count(*) FROM public.product_master_values WHERE kind='product_type' AND is_system_type)=4
     AND (SELECT count(*) FROM public.product_master_values WHERE kind='product_type' AND is_system_type
       AND is_active AND type_key IN ('Raw Material','Semi-Finished','Finished Product','Packaging'))=4 THEN
    NULL;
  ELSE RAISE EXCEPTION 'Unexpected canonical Product Type state'; END IF;
  IF EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.product_master_values'::regclass
    AND conname='product_master_values_canonical_active_check') THEN
    RAISE EXCEPTION 'Retirement constraint already exists; inspect before applying';
  END IF;
END;
$preflight$;
ALTER TABLE public.product_master_values ADD CONSTRAINT product_master_values_canonical_active_check
  CHECK(kind <> 'product_type' OR NOT is_system_type OR is_active);
CREATE OR REPLACE FUNCTION public.guard_product_type_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  IF OLD.kind <> 'product_type' THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
  IF TG_OP='DELETE' THEN
    IF OLD.is_system_type THEN RAISE EXCEPTION 'product_type_protected'; END IF;
    IF EXISTS(SELECT 1 FROM public.products WHERE product_type=OLD.type_key) THEN RAISE EXCEPTION 'product_type_in_use'; END IF;
    IF OLD.code_counter > 0 THEN RAISE EXCEPTION 'product_type_protected'; END IF;
    IF EXISTS(SELECT 1 FROM public.audit_logs WHERE metadata->>'product_type'=OLD.type_key
      OR metadata->>'old_type'=OLD.type_key OR metadata->>'new_type'=OLD.type_key) THEN
      RAISE EXCEPTION 'product_type_protected';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP='UPDATE' AND NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF OLD.is_system_type OR NOT OLD.is_active OR NEW.is_active THEN
      RAISE EXCEPTION 'product_type_protected';
    END IF;
    IF auth.uid() IS NULL OR NOT public.has_module_permission('Master Data','view')
      OR NOT public.has_module_permission('Master Data','delete') THEN
      RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='product_type_permission';
    END IF;
    IF (to_jsonb(NEW)-'is_active'-'updated_at') IS DISTINCT FROM
       (to_jsonb(OLD)-'is_active'-'updated_at') THEN
      RAISE EXCEPTION 'product_type_identity';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' AND NOT OLD.is_active AND to_jsonb(NEW) IS DISTINCT FROM to_jsonb(OLD) THEN
    RAISE EXCEPTION 'product_type_retired';
  END IF;
  IF (NEW.kind,NEW.type_key,NEW.is_system_type,NEW.type_allocation,NEW.code_prefix)
    IS DISTINCT FROM (OLD.kind,OLD.type_key,OLD.is_system_type,OLD.type_allocation,OLD.code_prefix)
    OR NEW.code_counter < OLD.code_counter THEN
    RAISE EXCEPTION 'product_type_identity';
  END IF;
  IF OLD.allows_ingredient AND NOT NEW.allows_ingredient
    AND EXISTS(SELECT 1 FROM public.recipe_ingredients i JOIN public.products p ON p.id=i.product_id WHERE p.product_type=OLD.type_key) THEN
    RAISE EXCEPTION 'product_type_ingredient_in_use';
  END IF;
  IF OLD.allows_recipe_product AND NOT NEW.allows_recipe_product
    AND EXISTS(SELECT 1 FROM public.recipes r JOIN public.products p ON p.id=r.product_id WHERE p.product_type=OLD.type_key) THEN
    RAISE EXCEPTION 'product_type_recipe_in_use';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.manage_product_type(p_action text, p_id uuid DEFAULT NULL::uuid, p_name text DEFAULT NULL::text, p_arabic_name text DEFAULT NULL::text, p_allows_ingredient boolean DEFAULT NULL::boolean, p_allows_recipe_product boolean DEFAULT NULL::boolean, p_expected_updated_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS product_master_values
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  item public.product_master_values;
  allocation bigint;
  prefix text;
  permission text := CASE p_action WHEN 'add' THEN 'add' WHEN 'edit' THEN 'edit' WHEN 'delete' THEN 'delete' WHEN 'retire' THEN 'delete' END;
  name text := regexp_replace(p_name,'^[[:space:]]+|[[:space:]]+$','','g');
  arabic text := regexp_replace(p_arabic_name,'^[[:space:]]+|[[:space:]]+$','','g');
BEGIN
  IF auth.uid() IS NULL OR permission IS NULL OR NOT public.has_module_permission('Master Data','view') OR NOT public.has_module_permission('Master Data',permission) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='product_type_permission';
  END IF;
  IF p_action NOT IN ('delete','retire') THEN
    IF name IS NULL OR name !~ '[^[:space:]]' OR arabic IS NULL OR arabic !~ '[^[:space:]]' THEN RAISE EXCEPTION 'product_type_blank'; END IF;
    IF p_allows_ingredient IS NULL OR p_allows_recipe_product IS NULL THEN RAISE EXCEPTION 'product_type_configuration'; END IF;
  END IF;
  -- Same lock order as Category/Unit RPC; ordinary referencing writes are
  -- serialized before taking master row locks, preventing check/write races.
  LOCK TABLE public.products,public.recipes,public.recipe_ingredients IN SHARE ROW EXCLUSIVE MODE;
  IF p_action='add' THEN
    LOOP
      allocation := nextval('public.product_type_allocation_seq');
      prefix := 'T'||CASE WHEN allocation<10 THEN '0' ELSE '' END||allocation::text;
      EXIT WHEN NOT EXISTS(SELECT 1 FROM public.products WHERE product_code LIKE prefix||'-%')
        AND NOT EXISTS(SELECT 1 FROM public.product_master_values WHERE code_prefix=prefix)
        AND NOT EXISTS(SELECT 1 FROM public.audit_logs WHERE module_name='Product Master'
          AND (entity_code LIKE prefix||'-%' OR entity_id::text LIKE prefix||'-%'));
    END LOOP;
    INSERT INTO public.product_master_values
      (kind,value,arabic_name,type_key,allows_ingredient,allows_recipe_product,is_system_type,type_allocation,code_prefix,code_counter)
    VALUES ('product_type',name,arabic,'custom:'||gen_random_uuid()::text,p_allows_ingredient,p_allows_recipe_product,false,allocation,prefix,0)
    RETURNING * INTO item;
    RETURN item;
  END IF;
  SELECT * INTO item FROM public.product_master_values WHERE id=p_id AND kind='product_type' FOR UPDATE;
  IF NOT FOUND OR p_expected_updated_at IS NULL OR item.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'product_type_stale'; END IF;
  IF p_action='retire' THEN
    IF item.is_system_type THEN RAISE EXCEPTION 'product_type_protected'; END IF;
    IF NOT item.is_active THEN RAISE EXCEPTION 'product_type_retired'; END IF;
    UPDATE public.product_master_values SET is_active=false,updated_at=clock_timestamp()
      WHERE id=p_id RETURNING * INTO item;
    RETURN item;
  END IF;
  IF p_action='edit' AND NOT item.is_active THEN RAISE EXCEPTION 'product_type_retired'; END IF;
  IF p_action='delete' THEN
    DELETE FROM public.product_master_values WHERE id=p_id RETURNING * INTO item;
  ELSE
    UPDATE public.product_master_values SET value=name,arabic_name=arabic,
      allows_ingredient=p_allows_ingredient,allows_recipe_product=p_allows_recipe_product,updated_at=clock_timestamp()
    WHERE id=p_id RETURNING * INTO item;
  END IF;
  RETURN item;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='product_type_duplicate';
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_product_type_relationship()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE item public.product_master_values;
BEGIN
  IF TG_TABLE_NAME='products' THEN
    IF TG_OP='UPDATE' AND NEW.product_type IS NOT DISTINCT FROM OLD.product_type THEN RETURN NEW; END IF;
    -- INSERT later runs the code generator, which needs the same exclusive
    -- row lock. Acquire it immediately rather than upgrading two concurrent
    -- shared locks and risking a lock-upgrade deadlock.
    SELECT * INTO item FROM public.product_master_values WHERE type_key=NEW.product_type AND kind='product_type' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_type_configuration'; END IF;
    IF NOT item.is_active THEN RAISE EXCEPTION 'product_type_retired'; END IF;
    IF NOT item.allows_recipe_product AND EXISTS(SELECT 1 FROM public.recipes WHERE product_id=NEW.id) THEN RAISE EXCEPTION 'product_type_recipe_in_use'; END IF;
    IF NOT item.allows_ingredient AND EXISTS(SELECT 1 FROM public.recipe_ingredients WHERE product_id=NEW.id) THEN RAISE EXCEPTION 'product_type_ingredient_in_use'; END IF;
  ELSE
    IF TG_OP='UPDATE' AND NEW.product_id IS NOT DISTINCT FROM OLD.product_id THEN
      IF TG_TABLE_NAME <> 'recipe_ingredients' THEN RETURN NEW; END IF;
      IF NEW.recipe_id IS NOT DISTINCT FROM OLD.recipe_id THEN RETURN NEW; END IF;
    END IF;
    -- Lock the Product against a concurrent type change, then its type against
    -- an eligibility change. Foreign keys still enforce reference existence.
    PERFORM 1 FROM public.products WHERE id=NEW.product_id FOR SHARE;
    SELECT m.* INTO item FROM public.product_master_values m JOIN public.products p ON p.product_type=m.type_key
      WHERE p.id=NEW.product_id AND m.kind='product_type' FOR SHARE OF m;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_type_configuration'; END IF;
    IF NOT item.is_active THEN RAISE EXCEPTION 'product_type_retired'; END IF;
    IF TG_TABLE_NAME='recipes' AND NOT item.allows_recipe_product THEN RAISE EXCEPTION 'product_type_recipe_not_allowed'; END IF;
    IF TG_TABLE_NAME='recipe_ingredients' AND NOT item.allows_ingredient THEN RAISE EXCEPTION 'product_type_ingredient_not_allowed'; END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_product_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item public.product_master_values;
  next_number bigint;
BEGIN
  SELECT * INTO item FROM public.product_master_values WHERE type_key=NEW.product_type AND kind='product_type' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'product_type_configuration'; END IF;
    IF NOT item.is_active THEN RAISE EXCEPTION 'product_type_retired'; END IF;
  IF item.is_system_type THEN
    IF NEW.product_code IS NOT NULL AND trim(NEW.product_code)<>'' THEN RETURN NEW; END IF;
    CASE item.type_key
      WHEN 'Raw Material' THEN next_number:=nextval('public.product_raw_material_seq');
      WHEN 'Semi-Finished' THEN next_number:=nextval('public.product_semi_finished_seq');
      WHEN 'Finished Product' THEN next_number:=nextval('public.product_finished_seq');
      WHEN 'Packaging' THEN next_number:=nextval('public.product_packaging_seq');
      ELSE RAISE EXCEPTION 'product_type_configuration';
    END CASE;
    NEW.product_code:=item.code_prefix||'-'||lpad(next_number::text,4,'0');
  ELSE
    IF NEW.product_code IS NOT NULL AND trim(NEW.product_code)<>'' THEN RAISE EXCEPTION 'product_type_automatic_code'; END IF;
    LOOP
      UPDATE public.product_master_values SET code_counter=code_counter+1 WHERE id=item.id RETURNING code_counter INTO next_number;
      NEW.product_code:=item.code_prefix||'-'||CASE WHEN next_number<10000 THEN lpad(next_number::text,4,'0') ELSE next_number::text END;
      EXIT WHEN NOT EXISTS(SELECT 1 FROM public.products WHERE product_code=NEW.product_code)
        AND NOT EXISTS(SELECT 1 FROM public.audit_logs WHERE module_name='Product Master'
          AND (entity_code=NEW.product_code OR entity_id::text=NEW.product_code));
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;
-- Also guard moving a historical ingredient into a different recipe.
DROP TRIGGER ingredient_product_type_guard ON public.recipe_ingredients;
CREATE TRIGGER ingredient_product_type_guard BEFORE INSERT OR UPDATE OF product_id,recipe_id
 ON public.recipe_ingredients FOR EACH ROW EXECUTE FUNCTION public.guard_product_type_relationship();
COMMIT;
