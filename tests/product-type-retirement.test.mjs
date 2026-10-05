// Isolated PGlite only. No production connection, Auth API, or network request.
// RETIREMENT_SCHEMA_FIXTURE = read-only captured public schema snapshot.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const root=path.resolve(import.meta.dirname,"..");
assert(process.env.RETIREMENT_SCHEMA_FIXTURE,"Set RETIREMENT_SCHEMA_FIXTURE to the captured schema snapshot");
const fixture=JSON.parse(fs.readFileSync(process.env.RETIREMENT_SCHEMA_FIXTURE,"utf8").replace(/^\uFEFF/,"" )).rows[0].snapshot;
const {PGlite}=await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const migration=fs.readFileSync(path.join(root,"supabase/migrations/20261004000500_product_type_retirement.sql"),"utf8");
const quote=(s)=>`'${String(s).replaceAll("'","''")}'`;
const uid=(n)=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
let passed=0;
const pass=(name)=>{passed++;console.log(`PASS ${name}`);};
const db=new PGlite();
await db.exec(`CREATE ROLE authenticated;CREATE ROLE anon;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated,anon;`);
for(const table of [...new Set(fixture.columns.map(c=>c.table))]){
 const cols=fixture.columns.filter(c=>c.table===table).map(c=>`"${c.name}" ${c.type}${c.identity?` GENERATED ${c.identity==="a"?"ALWAYS":"BY DEFAULT"} AS IDENTITY`:c.default?` DEFAULT ${c.default}`:""}${c.notnull?" NOT NULL":""}`).join(",");
 await db.exec(`CREATE TABLE public.${table}(${cols});`);
}
for(const c of [...fixture.constraints.filter(c=>!c.definition.startsWith("FOREIGN KEY")),...fixture.constraints.filter(c=>c.definition.startsWith("FOREIGN KEY"))]) await db.exec(`ALTER TABLE public.${c.table} ADD CONSTRAINT ${c.name} ${c.definition};`);
for(const seq of fixture.sequences){
 if(!["roles_id_seq","role_permissions_id_seq","audit_logs_id_seq","system_settings_id_seq"].includes(seq.sequencename))await db.exec(`CREATE SEQUENCE public.${seq.sequencename};`);
}
for(const [table,rows] of [["roles",fixture.roles],["role_permissions",fixture.permissions],["product_master_values",fixture.metadata]]){
 const columns=fixture.columns.filter(c=>c.table===table).map(c=>`"${c.name}"`).join(",");
 await db.exec(`INSERT INTO public.${table}(${columns}) OVERRIDING SYSTEM VALUE SELECT ${columns} FROM jsonb_populate_recordset(NULL::public.${table},${quote(JSON.stringify(rows))}::jsonb);`);
}
for(const entry of fixture.sequence_states){
 const value=Number(entry.state.match(/<last_value>(\d+)<\/last_value>/)[1]);const called=entry.state.includes("<is_called>true");
 await db.exec(`SELECT setval('public.${entry.name}',${value},${called});`); // isolated seed only
}
await db.exec(`INSERT INTO auth.users VALUES('${uid(1)}'),('${uid(4)}');
INSERT INTO public.profiles(id,full_name,username,email,role_id) VALUES
('${uid(1)}','Isolated Admin','isolated-admin','admin@example.invalid',1),('${uid(4)}','Isolated Delegate','isolated-delegate','delegate@example.invalid',4);`);
const required=["has_module_permission","current_user_role_id","is_system_admin","is_current_user_system_admin","manage_product_type","manage_product_master_value","guard_product_type_metadata","guard_product_type_relationship","generate_product_code","guard_product_master_values"];
for(const f of fixture.functions.filter(f=>required.includes(f.name)))await db.exec(f.definition);
for(const t of fixture.triggers.filter(t=>["product_type_metadata_guard","product_type_relationship_guard","recipe_product_type_guard","ingredient_product_type_guard","trigger_generate_product_code","product_master_values_guard"].includes(t.name)))await db.exec(t.definition);
for(const table of ["profiles","roles","role_permissions","product_master_values"]){
 await db.exec(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;GRANT SELECT,INSERT,UPDATE,DELETE ON public.${table} TO authenticated;`);
 for(const p of fixture.policies.filter(p=>p.tablename===table))await db.exec(`CREATE POLICY "${p.policyname}" ON public.${table} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.join(",")}${p.qual?` USING (${p.qual})`:""}${p.with_check?` WITH CHECK (${p.with_check})`:""};`);
}
await db.exec(`GRANT SELECT,INSERT,UPDATE,DELETE ON public.products,public.recipes,public.recipe_ingredients TO authenticated;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;`);
const snapshot=async()=> (await db.query(`SELECT jsonb_build_object(
'masters',(SELECT jsonb_agg(to_jsonb(m) ORDER BY id) FROM product_master_values m),
'permissions',(SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM role_permissions p),
'roles',(SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM roles r),
'profiles',(SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM profiles p),
'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY tablename,policyname) FROM pg_policies p),
'sequences',(SELECT jsonb_agg(to_jsonb(s) ORDER BY sequencename) FROM pg_sequences s WHERE schemaname='public')) AS state`)).rows[0].state;
const before=await snapshot();await db.exec(migration);assert.deepEqual(await snapshot(),before);
pass("migration installs without changing master rows, profiles, roles, permissions, RLS or sequence states");
const runAs=async(id,sql,args=[])=>{
 await db.exec("RESET ROLE");await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec("SET ROLE authenticated");
 try{return await db.query(sql,args);}finally{await db.exec("RESET ROLE");}
};
const admin=(sql,args)=>runAs(uid(1),sql,args);
const row=async(id)=>(await db.query("SELECT to_jsonb(m) AS item FROM product_master_values m WHERE id=$1",[id])).rows[0].item;
const create=async(name="Isolated custom")=>(await admin("SELECT to_jsonb(manage_product_type('add',NULL,$1,$2,true,true)) AS item",[name,"نوع تجريبي"])).rows[0].item;
const retire=async(item,id=uid(1))=>runAs(id,"SELECT to_jsonb(manage_product_type('retire',$1,NULL,NULL,NULL,NULL,$2)) AS item",[item.id,item.updated_at]);
for(const canonical of fixture.metadata.filter(m=>m.is_system_type)){
 await assert.rejects(retire(canonical),/product_type_protected/);
 await assert.rejects(db.query("UPDATE product_master_values SET is_active=false WHERE id=$1",[canonical.id]),/product_type_protected/);
}
await assert.rejects(db.exec("INSERT INTO product_master_values(kind,value,arabic_name,type_key,allows_ingredient,allows_recipe_product,is_system_type,code_prefix,is_active) VALUES('product_type','Fake canonical','نظام','Fake canonical',true,true,true,'RM',false)"),/canonical_active/);
pass("all four canonical types cannot retire via RPC/direct update; inactive canonical insertion rejected");
const custom=await create();
await assert.rejects(db.query("UPDATE product_master_values SET is_active=false,value='Changed' WHERE id=$1",[custom.id]),/product_type_permission|product_type_identity/);
await db.query("UPDATE role_permissions SET can_view=false,can_delete=true WHERE role_id=4 AND module_name='Master Data'");
await assert.rejects(retire(custom,uid(4)),/product_type_permission/);
await db.query("UPDATE role_permissions SET can_view=true,can_delete=false WHERE role_id=4 AND module_name='Master Data'");
await assert.rejects(retire(custom,uid(4)),/product_type_permission/);
await db.query("UPDATE role_permissions SET can_view=true,can_delete=true WHERE role_id=4 AND module_name='Master Data'");
assert.equal((await runAs(uid(4),"UPDATE product_master_values SET is_active=false WHERE id=$1 RETURNING id",[custom.id])).rows.length,0);
await assert.rejects(runAs(uid(4),"SELECT manage_product_type('retire',$1,NULL,NULL,NULL,NULL,'2000-01-01')",[custom.id]),/product_type_stale/);
pass("View AND Delete required, raw delegated writes blocked, stale retirement denied");
const insertProduct=async(type,id,code=null)=>admin("INSERT INTO products(id,product_code,name,product_type,category,base_unit) VALUES($1,$2,'Isolated Product',$3,'Flour','Kg') RETURNING *",[uid(id),code,type]);
const product=(await insertProduct(custom.type_key,100)).rows[0];
assert.equal(product.product_code,`${custom.code_prefix}-0001`);
await admin("INSERT INTO recipes(id,recipe_number,recipe_code,product_id,yield_quantity,yield_unit,created_by) VALUES($1,'ISOLATED-1','ISOLATED-1',$2,1,'Kg',$3)",[uid(101),product.id,uid(1)]);
await admin("INSERT INTO recipe_ingredients(id,recipe_id,product_id,quantity,unit) VALUES($1,$2,$3,1,'Kg')",[uid(102),uid(101),product.id]);
const historic=(await db.query("SELECT jsonb_build_object('products',(SELECT jsonb_agg(to_jsonb(p)) FROM products p),'recipes',(SELECT jsonb_agg(to_jsonb(r)) FROM recipes r),'ingredients',(SELECT jsonb_agg(to_jsonb(i)) FROM recipe_ingredients i)) AS data")).rows[0].data;
const prior=await row(custom.id);const priorSequences=(await snapshot()).sequences;
const retired=(await retire(prior,uid(4))).rows[0].item;
assert.deepEqual({...retired,is_active:prior.is_active,updated_at:prior.updated_at},prior);
assert.equal(retired.is_active,false);assert.equal(retired.code_counter,1);
assert.deepEqual((await snapshot()).sequences,priorSequences);
assert.deepEqual((await db.query("SELECT jsonb_build_object('products',(SELECT jsonb_agg(to_jsonb(p)) FROM products p),'recipes',(SELECT jsonb_agg(to_jsonb(r)) FROM recipes r),'ingredients',(SELECT jsonb_agg(to_jsonb(i)) FROM recipe_ingredients i)) AS data")).rows[0].data,historic);
pass("authorized retirement changes only active/timestamp; issued numbering, allocation and historical rows preserved");
await assert.rejects(retire(retired),/product_type_retired/);
await assert.rejects(db.query("UPDATE product_master_values SET is_active=true WHERE id=$1",[retired.id]),/product_type_protected/);
for(const [column,value] of [["code_counter",0],["value","Changed"],["type_key","custom:changed"],["code_prefix","T999"],["type_allocation",999]]){
 await assert.rejects(db.query(`UPDATE product_master_values SET ${column}=$1 WHERE id=$2`,[value,retired.id]),/product_type_retired|product_type_identity/);
}
await assert.rejects(admin("SELECT manage_product_type('edit',$1,'Changed','تغيير',true,true,$2)",[retired.id,retired.updated_at]),/product_type_retired/);
await assert.rejects(admin("SELECT manage_product_type('delete',$1,NULL,NULL,NULL,NULL,$2)",[retired.id,retired.updated_at]),/product_type_in_use|product_type_protected/);
pass("one-way retirement; metadata frozen; existing issued/in-use deletion protection preserved");
const guardSeq=(await snapshot()).sequences;
await assert.rejects(insertProduct(retired.type_key,200),/product_type_retired/);
await assert.rejects(insertProduct(retired.type_key,200,"MANUAL"),/product_type_retired/);
await assert.rejects(admin("INSERT INTO recipes(id,recipe_number,recipe_code,product_id,yield_quantity,yield_unit,created_by) VALUES($1,'ISOLATED-2','ISOLATED-2',$2,1,'Kg',$3)",[uid(201),product.id,uid(1)]),/product_type_retired/);
await assert.rejects(admin("INSERT INTO recipe_ingredients(id,recipe_id,product_id,quantity,unit) VALUES($1,$2,$3,1,'Kg')",[uid(202),uid(101),product.id]),/product_type_retired/);
assert.deepEqual((await snapshot()).sequences,guardSeq);assert.equal((await row(retired.id)).code_counter,1);
pass("new Product/Recipe/Ingredient inserts reject retired metadata without consuming counters or sequences");
await admin("UPDATE products SET name='Historical edit',product_type=product_type WHERE id=$1",[product.id]);
await admin("UPDATE recipes SET description='Historical edit',product_id=product_id WHERE id=$1",[uid(101)]);
await admin("UPDATE recipe_ingredients SET quantity=2,product_id=product_id WHERE id=$1",[uid(102)]);
const active=await create("Still active");const activeProduct=(await insertProduct(active.type_key,300)).rows[0];
await assert.rejects(admin("UPDATE products SET product_type=$1 WHERE id=$2",[retired.type_key,activeProduct.id]),/product_type_retired/);
await admin("INSERT INTO recipes(id,recipe_number,recipe_code,product_id,yield_quantity,yield_unit,created_by) VALUES($1,'ISOLATED-3','ISOLATED-3',$2,1,'Kg',$3)",[uid(301),activeProduct.id,uid(1)]);
await admin("INSERT INTO recipe_ingredients(id,recipe_id,product_id,quantity,unit) VALUES($1,$2,$3,1,'Kg')",[uid(302),uid(301),activeProduct.id]);
await assert.rejects(admin("UPDATE recipes SET product_id=$1 WHERE id=$2",[product.id,uid(301)]),/product_type_retired/);
await assert.rejects(admin("UPDATE recipe_ingredients SET product_id=$1 WHERE id=$2",[product.id,uid(302)]),/product_type_retired/);
await assert.rejects(admin("UPDATE recipe_ingredients SET recipe_id=$1 WHERE id=$2",[uid(301),uid(102)]),/product_type_retired/);
pass("unchanged historical references remain editable; changing references to retired types denied");
const canonicalBefore=(await snapshot()).sequences;
for(const [key,prefix] of [["Raw Material","RM"],["Semi-Finished","SF"],["Finished Product","FP"],["Packaging","PK"]]){
 const result=(await insertProduct(key,400+["RM","SF","FP","PK"].indexOf(prefix))).rows[0];assert(result.product_code.startsWith(prefix+"-"));
}
assert.equal((await insertProduct(active.type_key,500)).rows[0].product_code,`${active.code_prefix}-0002`);
assert.equal((await snapshot()).sequences.find(s=>s.sequencename==="product_type_allocation_seq").last_value,canonicalBefore.find(s=>s.sequencename==="product_type_allocation_seq").last_value);
pass("active canonical generators retain RM/SF/FP/PK; active custom numbering remains sequential");
const txType=await create("Atomic retirement");await db.exec("BEGIN");await db.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[uid(1)]);
await db.query("SELECT manage_product_type('retire',$1,NULL,NULL,NULL,NULL,$2)",[txType.id,txType.updated_at]);await db.exec("ROLLBACK");assert.deepEqual(await row(txType.id),txType);
pass("retirement rolls back atomically with unchanged row/counter");
const noRefs=await create("After clearing products");const noRefsProduct=(await insertProduct(noRefs.type_key,600)).rows[0];await db.query("DELETE FROM products WHERE id=$1",[noRefsProduct.id]);const issued=await row(noRefs.id);await retire(issued);assert.equal((await row(noRefs.id)).code_counter,1);
await assert.rejects(admin("SELECT manage_product_type('delete',$1,NULL,NULL,NULL,NULL,$2)",[noRefs.id,(await row(noRefs.id)).updated_at]),/product_type_protected/);
pass("issued custom type retires after its Product is cleared; counter remains reserved and deletion blocked");
const cat=(await admin("SELECT to_jsonb(manage_product_master_value('add','category',NULL,'Isolated Category')) AS item")).rows[0].item;
await admin("SELECT manage_product_master_value('delete','category',$1,NULL,$2)",[cat.id,cat.updated_at]);
const unit=(await admin("SELECT to_jsonb(manage_product_master_value('add','unit',NULL,'Isolated Unit')) AS item")).rows[0].item;
await admin("SELECT manage_product_master_value('delete','unit',$1,NULL,$2)",[unit.id,unit.updated_at]);
await assert.rejects(admin("SELECT manage_product_master_value('delete','category',$1,NULL,$2)",[fixture.metadata.find(m=>m.kind==="category"&&m.value==="Flour").id,fixture.metadata.find(m=>m.kind==="category"&&m.value==="Flour").updated_at]),/master_values_in_use/);
pass("Category/Unit CRUD and usage protections remain unchanged");
for(const module of ["Product Master","Recipes","Dashboard","Reports","Audit Trail","ERP Entry"]){
 await db.query("UPDATE role_permissions SET can_view=false,can_add=false,can_edit=false,can_delete=false WHERE role_id=4");
 await db.query("UPDATE role_permissions SET can_view=true WHERE role_id=4 AND module_name=$1",[module]);
 const result=await runAs(uid(4),"SELECT value,type_key,is_active FROM product_master_values WHERE id=$1",[retired.id]);assert.equal(result.rows.length,1);assert.equal(result.rows[0].value,retired.value);
}
pass("six authorized consumer modules read retired metadata without Master Data View");
for(const name of ["manage_product_type","guard_product_type_metadata","guard_product_type_relationship","generate_product_code"]){
 const f=(await db.query("SELECT pg_get_functiondef(oid) AS definition FROM pg_proc WHERE proname=$1",[name])).rows[0].definition;
 if(name==="manage_product_type")assert(f.includes("SHARE ROW EXCLUSIVE")&&f.includes("FOR UPDATE")&&f.includes("product_type_stale"));
 else if(name==="guard_product_type_relationship")assert(f.includes("FOR UPDATE")&&f.includes("FOR SHARE OF m"));
}
pass("existing lock order, row locks, stale checks and backend guard attachment preserved (multi-session stress not simulated)");

await db.close();
// Render the actual provider/modal with local mocks; never call Supabase.
const require=createRequire(path.resolve(process.env.PGLITE_MODULE,"../../../../package.json"));
const React=require("react"), renderer=require("react-test-renderer"), ts=require("typescript");
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {act}=renderer;
let language="en", current, calls=0,closed=0;
let metadata=[{...retired,is_active:false},{...active,is_active:true}];
const mocks={react:React,"react/jsx-runtime":require("react/jsx-runtime"),
 "react-i18next":{useTranslation:()=>({i18n:{language},t:key=>key})},
 "./AuthContext":{useAuth:()=>({profile:{id:uid(1),role_id:1}})},
 "../services/productTypesService":{getProductTypes:async()=>metadata,manageProductType:async(action)=>{assert.equal(action,"retire");calls++;return retired;},productTypeError:()=>"error"},
 "../lib/supabaseClient":{supabase:{channel:()=>({on(){return this;},subscribe(){return this;}}),removeChannel:()=>{}}},
 "react-dom":{createPortal:child=>child},"lucide-react":{X:()=>null}};
const compile=file=>{const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(path.join(root,file),"utf8"),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(js,{module,exports:module.exports,require:id=>mocks[id],window:{addEventListener(){},removeEventListener(){}},document:{body:{},activeElement:null},console});return module.exports;};
const context=compile("src/context/ProductTypesContext.jsx");
const Probe=()=>{current=context.useProductTypes();return null;};
let tree;
await act(async()=>{tree=renderer.create(React.createElement(context.ProductTypesProvider,null,React.createElement(Probe)));});
assert.equal(current.types.length,2);assert.equal(current.activeTypes.length,1);
assert.equal(current.canCreateRecipe(retired.type_key),false);assert.equal(current.canUseIngredient(retired.type_key),false);
assert.equal(current.allowsRecipes(retired.type_key),true);assert.equal(current.label(retired.type_key),retired.value);
language="ar";await act(async()=>{tree.update(React.createElement(context.ProductTypesProvider,null,React.createElement(Probe)));});
assert.equal(current.label(retired.type_key),retired.arabic_name);
metadata=metadata.map(m=>m.id===active.id?{...m,is_active:false}:m);
await act(async()=>{await current.changed("retire",metadata[1]);});assert.equal(current.activeTypes.length,0);assert.equal(current.types.length,2);
await act(async()=>tree.unmount());
pass("actual context preserves English/Arabic historical labels and removes retired options after refresh");
const Modal=compile("src/components/ManageProductTypeModal.jsx").default;
for(const allowed of [false,true]){
 await act(async()=>{tree=renderer.create(React.createElement(Modal,{action:"retire",item:retired,canDelete:allowed,onChange:()=>{},onClose:()=>{closed++;}}));});
 assert.equal(tree.root.findAllByType("input").length,0);assert.equal(tree.root.findAllByType("select").length,0);
 assert.equal(tree.root.findAllByProps({type:"submit"}).length,allowed?1:0);
 await act(async()=>{await tree.root.findByType("form").props.onSubmit({preventDefault(){}});});
 await act(async()=>tree.unmount());
}
assert.equal(calls,1);assert.equal(closed,1);
pass("actual retirement confirmation calls existing service only with Delete permission; no editable metadata fields");
const source=file=>fs.readFileSync(path.join(root,file),"utf8");
assert(source("src/pages/Settings.jsx").includes('activeTypes: productTypes'));
assert(source("src/pages/Settings.jsx").includes('action === "retire" ? "delete" : action'));
assert(source("src/pages/ProductMaster.jsx").includes('activeTypes.map'));
assert(source("src/pages/ProductMaster.jsx").includes('value={item.type_key} disabled'));
assert(source("src/pages/Recipes.jsx").includes('canCreateRecipe(product.type)')&&source("src/pages/Recipes.jsx").includes('canUseIngredient(product.type)'));
assert.equal((source("src/i18n.js").match(/confirmRetire:/g)||[]).length,2);
assert(source("src/services/productTypesService.js").includes('is_system_type,is_active,code_counter,updated_at'));
pass("Settings/form selection, existing Product retention, Recipe/Ingredient selection and bilingual retirement contracts");
console.log(`${passed} retirement verification groups PASS. Isolated only; no production calls. Multi-session concurrency stress not simulated.`);
