-- Prepared only. Apply after isolated verification and explicit approval.
BEGIN;
LOCK TABLE public.products, public.recipes, public.recipe_ingredients
  IN SHARE ROW EXCLUSIVE MODE;

DO $preflight$
BEGIN
  IF to_regprocedure('public.has_module_permission(text,text)') IS NULL
    OR to_regprocedure('public.generate_product_code()') IS NULL
    OR to_regprocedure('public.audit_products_changes()') IS NULL
    OR NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.products'::regclass
      AND conname='products_product_type_check'
      AND pg_get_constraintdef(oid) = 'CHECK ((product_type = ANY (ARRAY[''Raw Material''::text, ''Semi-Finished''::text, ''Finished Product''::text, ''Packaging''::text])))')
    OR EXISTS (SELECT 1 FROM public.products WHERE product_type NOT IN
      ('Raw Material','Semi-Finished','Finished Product','Packaging')) THEN
    RAISE EXCEPTION 'Product Type schema differs from verified schema';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
    AND table_name='product_master_values' AND column_name='type_key') THEN
    RAISE EXCEPTION 'Product Type metadata already exists; inspect before applying';
  END IF;
END;
$preflight$;

ALTER TABLE public.product_master_values
  DROP CONSTRAINT product_master_values_kind_check,
  ADD CONSTRAINT product_master_values_kind_check CHECK (kind IN ('category','unit','product_type')),
  ADD COLUMN type_key text UNIQUE,
  ADD COLUMN arabic_name text,
  ADD COLUMN allows_ingredient boolean,
  ADD COLUMN allows_recipe_product boolean,
  ADD COLUMN is_system_type boolean,
  ADD COLUMN type_allocation bigint UNIQUE,
  ADD COLUMN code_prefix text UNIQUE,
  ADD COLUMN code_counter bigint,
  ADD CONSTRAINT product_master_values_type_metadata_check CHECK (
    (kind <> 'product_type' AND type_key IS NULL AND arabic_name IS NULL
      AND allows_ingredient IS NULL AND allows_recipe_product IS NULL
      AND is_system_type IS NULL AND type_allocation IS NULL
      AND code_prefix IS NULL AND code_counter IS NULL)
    OR (kind = 'product_type' AND type_key IS NOT NULL AND type_key <> ''
      AND arabic_name IS NOT NULL AND arabic_name ~ '[^[:space:]]'
      AND arabic_name = regexp_replace(arabic_name,'^[[:space:]]+|[[:space:]]+$','','g')
      AND allows_ingredient IS NOT NULL AND allows_recipe_product IS NOT NULL
      AND is_system_type IS NOT NULL AND code_prefix IS NOT NULL
      AND ((is_system_type AND type_allocation IS NULL AND code_counter IS NULL
        AND (type_key,code_prefix) IN (('Raw Material','RM'),('Semi-Finished','SF'),('Finished Product','FP'),('Packaging','PK')))
        OR (NOT is_system_type AND type_allocation IS NOT NULL AND type_allocation > 0
          AND code_counter IS NOT NULL AND code_counter >= 0
          AND code_prefix = 'T'||CASE WHEN type_allocation < 10 THEN '0' ELSE '' END||type_allocation::text))));

-- This is a new allocator. No canonical sequence is changed or consumed.
CREATE SEQUENCE public.product_type_allocation_seq AS bigint NO CYCLE;
REVOKE ALL ON SEQUENCE public.product_type_allocation_seq FROM PUBLIC, anon, authenticated;

INSERT INTO public.product_master_values
  (kind,value,type_key,arabic_name,allows_ingredient,allows_recipe_product,is_system_type,code_prefix)
VALUES
  ('product_type','Raw Material','Raw Material','مادة خام',true,false,true,'RM'),
  ('product_type','Semi-Finished','Semi-Finished','منتج نصف مصنع',true,true,true,'SF'),
  ('product_type','Finished Product','Finished Product','منتج نهائي',false,true,true,'FP'),
  ('product_type','Packaging','Packaging','تغليف',true,false,true,'PK');

-- Products keep their original text and codes. Install/validate FK before
-- removing the old CHECK; no invalid-value window and no Product backfill.
ALTER TABLE public.products ADD CONSTRAINT products_product_type_fkey
  FOREIGN KEY (product_type) REFERENCES public.product_master_values(type_key)
  ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE FUNCTION public.guard_product_type_metadata() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
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
  IF (NEW.kind,NEW.type_key,NEW.is_system_type,NEW.type_allocation,NEW.code_prefix)
    IS DISTINCT FROM (OLD.kind,OLD.type_key,OLD.is_system_type,OLD.type_allocation,OLD.code_prefix)
    OR NEW.code_counter < OLD.code_counter OR NEW.is_active IS DISTINCT FROM OLD.is_active THEN
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
CREATE TRIGGER product_type_metadata_guard BEFORE UPDATE OR DELETE ON public.product_master_values
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_type_metadata();

CREATE FUNCTION public.manage_product_type(p_action text,p_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,p_arabic_name text DEFAULT NULL,
  p_allows_ingredient boolean DEFAULT NULL,p_allows_recipe_product boolean DEFAULT NULL,
  p_expected_updated_at timestamptz DEFAULT NULL) RETURNS public.product_master_values
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE
  item public.product_master_values;
  allocation bigint;
  prefix text;
  permission text := CASE p_action WHEN 'add' THEN 'add' WHEN 'edit' THEN 'edit' WHEN 'delete' THEN 'delete' END;
  name text := regexp_replace(p_name,'^[[:space:]]+|[[:space:]]+$','','g');
  arabic text := regexp_replace(p_arabic_name,'^[[:space:]]+|[[:space:]]+$','','g');
BEGIN
  IF auth.uid() IS NULL OR permission IS NULL OR NOT public.has_module_permission('Settings',permission) THEN
    RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='product_type_permission';
  END IF;
  IF p_action <> 'delete' THEN
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
REVOKE ALL ON FUNCTION public.manage_product_type(text,uuid,text,text,boolean,boolean,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.manage_product_type(text,uuid,text,text,boolean,boolean,timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_product_code() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE
  item public.product_master_values;
  next_number bigint;
BEGIN
  SELECT * INTO item FROM public.product_master_values WHERE type_key=NEW.product_type AND kind='product_type' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'product_type_configuration'; END IF;
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

CREATE FUNCTION public.guard_product_type_relationship() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE item public.product_master_values;
BEGIN
  IF TG_TABLE_NAME='products' THEN
    IF TG_OP='UPDATE' AND NEW.product_type IS NOT DISTINCT FROM OLD.product_type THEN RETURN NEW; END IF;
    -- INSERT later runs the code generator, which needs the same exclusive
    -- row lock. Acquire it immediately rather than upgrading two concurrent
    -- shared locks and risking a lock-upgrade deadlock.
    SELECT * INTO item FROM public.product_master_values WHERE type_key=NEW.product_type AND kind='product_type' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_type_configuration'; END IF;
    IF NOT item.allows_recipe_product AND EXISTS(SELECT 1 FROM public.recipes WHERE product_id=NEW.id) THEN RAISE EXCEPTION 'product_type_recipe_in_use'; END IF;
    IF NOT item.allows_ingredient AND EXISTS(SELECT 1 FROM public.recipe_ingredients WHERE product_id=NEW.id) THEN RAISE EXCEPTION 'product_type_ingredient_in_use'; END IF;
  ELSE
    IF TG_OP='UPDATE' AND NEW.product_id IS NOT DISTINCT FROM OLD.product_id THEN RETURN NEW; END IF;
    -- Lock the Product against a concurrent type change, then its type against
    -- an eligibility change. Foreign keys still enforce reference existence.
    PERFORM 1 FROM public.products WHERE id=NEW.product_id FOR SHARE;
    SELECT m.* INTO item FROM public.product_master_values m JOIN public.products p ON p.product_type=m.type_key
      WHERE p.id=NEW.product_id AND m.kind='product_type' FOR SHARE OF m;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_type_configuration'; END IF;
    IF TG_TABLE_NAME='recipes' AND NOT item.allows_recipe_product THEN RAISE EXCEPTION 'product_type_recipe_not_allowed'; END IF;
    IF TG_TABLE_NAME='recipe_ingredients' AND NOT item.allows_ingredient THEN RAISE EXCEPTION 'product_type_ingredient_not_allowed'; END IF;
  END IF;
  RETURN NEW;
END;
$function$;
CREATE TRIGGER product_type_relationship_guard BEFORE INSERT OR UPDATE OF product_type ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_type_relationship();
CREATE TRIGGER recipe_product_type_guard BEFORE INSERT OR UPDATE OF product_id ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_type_relationship();
CREATE TRIGGER ingredient_product_type_guard BEFORE INSERT OR UPDATE OF product_id ON public.recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_type_relationship();

CREATE OR REPLACE VIEW public.v_product_master AS
SELECT p.id,p.product_code,p.name,p.product_type,p.category,p.base_unit,p.description,p.is_active,
  CASE WHEN NOT m.allows_recipe_product THEN NULL::boolean
    WHEN EXISTS(SELECT 1 FROM public.recipes r WHERE r.product_id=p.id) THEN true ELSE false END AS has_recipe,
  p.created_at,p.updated_at
FROM public.products p JOIN public.product_master_values m ON m.type_key=p.product_type AND m.kind='product_type';

-- Preserve Category/Unit read access exactly; extend only Product Type reads.
ALTER POLICY product_master_values_read ON public.product_master_values USING (
  public.has_module_permission('Product Master','view') OR public.has_module_permission('Product Master','add')
  OR public.has_module_permission('Product Master','edit') OR public.has_module_permission('Product Master','delete')
  OR public.has_module_permission('Settings','view') OR public.has_module_permission('Settings','add')
  OR public.has_module_permission('Settings','edit') OR public.has_module_permission('Settings','delete')
  OR (kind='product_type' AND (public.has_module_permission('Recipes','view')
    OR public.has_module_permission('Recipes','add') OR public.has_module_permission('Recipes','edit')
    OR public.has_module_permission('Dashboard','view') OR public.has_module_permission('Reports','view')
    OR public.has_module_permission('ERP Entry','view') OR public.has_module_permission('Audit Trail','view'))));

-- Preserve the original event logic, function OID and trigger. Add label
-- snapshots to future events only; never rewrite history.
DO $audit$
DECLARE definition text;
BEGIN
  definition:=pg_get_functiondef('public.audit_products_changes()'::regprocedure);
  IF position('''product_type'',' IN definition)=0 OR position('''new_type'',' IN definition)=0 THEN
    RAISE EXCEPTION 'Unexpected audit definition; aborting';
  END IF;
  definition:=replace(definition,'''product_type'',',
    '''type_name'', (SELECT value FROM public.product_master_values WHERE type_key=CASE WHEN TG_OP=''DELETE'' THEN OLD.product_type ELSE NEW.product_type END),
     ''type_arabic_name'', (SELECT arabic_name FROM public.product_master_values WHERE type_key=CASE WHEN TG_OP=''DELETE'' THEN OLD.product_type ELSE NEW.product_type END),
     ''product_type'',');
  definition:=replace(definition,'''new_type'',',
    '''old_type_name'', (SELECT value FROM public.product_master_values WHERE type_key=OLD.product_type),
     ''old_type_arabic_name'', (SELECT arabic_name FROM public.product_master_values WHERE type_key=OLD.product_type),
     ''type_name'', (SELECT value FROM public.product_master_values WHERE type_key=NEW.product_type),
     ''type_arabic_name'', (SELECT arabic_name FROM public.product_master_values WHERE type_key=NEW.product_type),
     ''new_type'',');
  EXECUTE definition;
END;
$audit$;

REVOKE ALL ON FUNCTION public.guard_product_type_metadata(),public.guard_product_type_relationship(),public.audit_products_changes()
  FROM PUBLIC,anon,authenticated;
ALTER TABLE public.products DROP CONSTRAINT products_product_type_check;
COMMIT;
