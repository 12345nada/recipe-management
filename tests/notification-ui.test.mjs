// Real Header + hook + notification service in Chromium. Guarded RPCs execute
// against PGlite only. Realtime lifecycle signals use a controlled SDK boundary.
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "vite";
const { PGlite } = await import(pathToFileURL(process.env.PGLITE_MODULE).href);
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
assert(process.env.NOTIFICATION_DB_DIRECTORY);
const db = new PGlite(process.env.NOTIFICATION_DB_DIRECTORY);
const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
let queue=Promise.resolve(); let heldResponse; let holdNext=false; let failRead=false;
const requests=[]; const errors=[];
const api=http.createServer((req,res)=>{
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","*");
  if(req.method==="OPTIONS"){res.end();return;}
  queue=queue.then(async()=>{
    const url=new URL(req.url,"http://127.0.0.1");
    const actor=req.headers["x-user"];
    const chunks=[];for await(const chunk of req) chunks.push(chunk);
    const body=chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
    requests.push({path:url.pathname,actor,body});
    try{
      let data;
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[actor]);await db.exec("SET ROLE authenticated");
      try{
        if(url.pathname==="/notifications")data=(await db.query("SELECT * FROM notifications ORDER BY created_at DESC,id LIMIT 30")).rows;
        else{
          const name=url.pathname.slice(1);
          assert(["get_notification_unread_count","mark_notification_read","mark_all_notifications_read","get_notification_destination"].includes(name));
          if(failRead && name==="mark_notification_read")throw Error("simulated RPC failure");
          data=(await db.query(`SELECT ${name}(${body.p_notification_id ? "$1" : ""}) AS value`,body.p_notification_id ? [body.p_notification_id] : [])).rows[0].value;
        }
      }finally{await db.exec("RESET ROLE");}
      const result=JSON.stringify({data,error:null});
      if(holdNext && url.pathname==="/notifications") {holdNext=false;heldResponse=()=>res.end(result);}
      else res.end(result);
    }catch(error){res.end(JSON.stringify({data:null,error:{message:error.message}}));}
  }).catch((error)=>{errors.push(error.message);res.end(JSON.stringify({error:{message:error.message}}));});
});
await new Promise((resolve)=>api.listen(55443,"127.0.0.1",resolve));
const root=path.resolve(import.meta.dirname,"..");
const fixtureClient=`
  const actor=()=>window.notificationTestUser;
  async function request(name,parameters){const response=await fetch('http://127.0.0.1:55443/'+name,{method:'POST',headers:{'Content-Type':'application/json','X-User':actor()},body:JSON.stringify(parameters||{})});return response.json();}
  const channels=new Set();window.notificationTestChannels=channels;
  window.notificationTestRealtime=()=>{for(const c of channels)c.change?.();};
  window.notificationTestReconnect=()=>{for(const c of channels)c.status?.('SUBSCRIBED');};
  export const supabase={
    from(name){if(name!=='notifications')throw Error('Unexpected table');return{select(){return this},eq(){return this},order(){return this},limit(){return request(name)}}},
    rpc:request,
    channel(){const c={on(_,filter,callback){this.filter=filter;this.change=callback;return this},subscribe(callback){this.status=callback;channels.add(this);queueMicrotask(()=>callback('SUBSCRIBED'));return this}};return c},
    removeChannel(c){channels.delete(c)}
  };`;
const fixtureAuth=`import {createContext,useContext} from 'react';export const NotificationTestAuth=createContext(null);export const useAuth=()=>useContext(NotificationTestAuth);`;
const entry=`
  import React,{useState} from 'react';import{createRoot}from'react-dom/client';
  import{BrowserRouter,useLocation}from'react-router-dom';
  import Header from '/src/components/Header.jsx';import i18n from '/src/i18n.js';
  import{NotificationTestAuth}from'notification-test-auth';
  const profiles={a:{id:'${uid(1)}',full_name:'Local admin',roles:{name:'Administrator'}},b:{id:'${uid(5)}',full_name:'Local reader',roles:{name:'Reader'}}};
  function App(){const[profile,setProfile]=useState(profiles.b);const[visible,setVisible]=useState(true);const location=useLocation();
    window.notificationTestUser=profile.id;window.notificationTestSwitch=(key)=>setProfile(profiles[key]);window.notificationTestUnmount=()=>setVisible(false);window.notificationTestLanguage=(language)=>i18n.changeLanguage(language);
    return React.createElement(NotificationTestAuth.Provider,{value:{profile,hasPermission:()=>false}},React.createElement('div',{className:'main-layout'},visible&&React.createElement(Header),React.createElement('output',{'data-testid':'destination'},location.pathname+location.search)))}
  i18n.changeLanguage('en');createRoot(document.getElementById('root')).render(React.createElement(BrowserRouter,null,React.createElement(App)));`;
const vite=await createServer({root,server:{host:"127.0.0.1",port:55179,strictPort:true},plugins:[{
  name:"notification-isolated-ui", enforce:"pre",
  resolveId(source,importer){
    if(source==="notification-test-auth"||(importer?.includes("Header.jsx")&&source.includes("AuthContext")))return "\0notification-test-auth";
    if(importer?.includes("notificationService.js")&&source.includes("supabaseClient"))return "\0notification-test-client";
    if(source==="/notification-test-entry.jsx")return "\0notification-test-entry.jsx";
  },
  load(id){if(id==="\0notification-test-auth")return fixtureAuth;if(id==="\0notification-test-client")return fixtureClient;if(id==="\0notification-test-entry.jsx")return entry;},
  configureServer(server){server.middlewares.use(async(req,res,next)=>{if(req.url?.split("?")[0]==="/notification-test"){res.setHeader("Content-Type","text/html");res.end(await server.transformIndexHtml('/notification-test','<html><head></head><body><div id="root"></div><script type="module" src="/notification-test-entry.jsx"></script></body></html>'));}else next();});},
}]});await vite.listen();
const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE,headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.route("**/*",(route)=>["localhost","127.0.0.1"].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
const page=await context.newPage();page.on("pageerror",(e)=>errors.push(e.message));
const pass=(name)=>console.log(`PASS ${name}`);
const waitCount=async(count)=>assert.equal(await page.locator(".notification-count").innerText(),String(count));
try{
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[uid(5)]);
  await db.query("SELECT mark_all_notifications_read()");
  await db.query("INSERT INTO notifications(user_id,notification_type,title,message,metadata) SELECT $1,'rejected','Fallback','Fallback',jsonb_build_object('version',1,'recipe_name','خبز bread','recipe_code','LOCAL-R','reason','تحتاج تعديل') FROM generate_series(1,40)",[uid(5)]);
  await page.goto("http://127.0.0.1:55179/notification-test");
  await page.waitForFunction(()=>document.querySelector('.notification-count')?.textContent==='40');
  await page.locator(".header-notification").click();
  await page.getByText("Recipe rejected",{exact:true}).first().waitFor();
  assert.equal(await page.locator(".header-notification-menu button[style]").count(),30);await waitCount(40);
  assert((await page.locator(".header-notification-menu").innerText()).includes("Reason: تحتاج تعديل"));
  pass("actual Header English presentation, rejection reason, 30 rows with full 40-row unread count");
  await page.evaluate(()=>window.notificationTestLanguage('ar'));
  await page.getByText("تم رفض الوصفة",{exact:true}).first().waitFor();
  assert((await page.locator(".header-notification-menu").innerText()).includes("السبب: تحتاج تعديل"));
  await page.setViewportSize({width:375,height:850});
  const box=await page.locator(".header-notification-menu").boundingBox();assert(box.x>=0&&box.x+box.width<=375);
  await page.screenshot({path:"D:/temp/notification-ui-ar-mobile.png"});
  pass("Arabic events/reason/date and mobile dropdown stay within viewport");
  await page.evaluate(()=>window.notificationTestLanguage('en'));
  await page.getByRole("button",{name:"Mark all as read"}).click();
  await page.waitForFunction(()=>!document.querySelector('.notification-count'));
  assert.equal((await db.query("SELECT count(*) FROM notifications WHERE user_id=$1 AND NOT is_read",[uid(5)])).rows[0].count,0);
  pass("actual Mark All button calls guarded RPC and clears authoritative unread count");
  const insertLegacy=async(message)=>db.query("INSERT INTO notifications(user_id,notification_type,title,message) VALUES($1,'legacy','Stored title',$2)",[uid(5),message]);
  await insertLegacy("Old stored text remains readable");await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.getByText("Old stored text remains readable",{exact:true}).waitFor();
  pass("focus refresh and historical stored-text compatibility");
  holdNext=true;await page.evaluate(()=>window.notificationTestRealtime());
  for(let i=0;!heldResponse&&i<50;i++)await new Promise(r=>setTimeout(r,20));assert(heldResponse);
  await insertLegacy("Latest authoritative notification");await page.evaluate(()=>window.notificationTestRealtime());
  await page.getByText("Latest authoritative notification",{exact:true}).waitFor();heldResponse();heldResponse=null;
  await page.waitForTimeout(100);assert.equal(await page.getByText("Latest authoritative notification",{exact:true}).count(),1);
  pass("older overlapping response cannot overwrite the newer notification fetch");
  await insertLegacy("Reconnect recovered");await page.evaluate(()=>window.notificationTestReconnect());await page.getByText("Reconnect recovered",{exact:true}).waitFor();
  await insertLegacy("Visibility recovered");await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.getByText("Visibility recovered",{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.notificationTestChannels.size),1);
  pass("reconnect/visibility recovery; exactly one notification subscription");
  failRead=true;await page.getByText("Visibility recovered",{exact:true}).click();await page.getByRole("alert").filter({hasText:"could not be marked"}).waitFor();
  assert.equal(await page.locator(".header-notification-menu").count(),1);failRead=false;
  await page.getByText("Visibility recovered",{exact:true}).click();await page.getByRole("alert").filter({hasText:"no longer available"}).waitFor();
  assert.equal(await page.locator("[data-testid=destination]").innerText(),"/notification-test");
  pass("failed read remains visible; missing/unauthorized content never navigates");
  const stamp=(await db.query("SELECT updated_at FROM recipes WHERE id=$1",[uid(20)])).rows[0].updated_at;
  await db.query("UPDATE recipes SET status='Approved',approved_at=now() WHERE id=$1",[uid(20)]);
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[uid(1)]);
  const assignment=(await db.query("SELECT assign_recipe_reader($1,$2,$3) AS value",[uid(20),uid(5),stamp])).rows[0].value;
  await page.evaluate(()=>window.notificationTestRealtime());await page.getByText("Recipe assigned to you",{exact:true}).waitFor();
  await page.getByText("Recipe assigned to you",{exact:true}).click();await page.waitForFunction((id)=>document.querySelector('[data-testid=destination]').textContent==='/recipes/reader/'+id,assignment.id);
  assert((await db.query("SELECT read_at FROM notifications WHERE notification_type='reader_assigned' AND metadata->>'assignment_id'=$1",[assignment.id])).rows[0].read_at);
  pass("assignment-only Reader clicks use assignment ID and server acknowledgement");
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[uid(1)]);await db.query("SELECT revoke_recipe_reader_assignment($1)",[assignment.id]);
  await page.locator(".header-notification").click();await page.getByText("Recipe assignment revoked",{exact:true}).waitFor();await page.getByText("Recipe assignment revoked",{exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-testid=destination]').textContent==='/recipes?tab=assigned');
  pass("revocation uses safe Assigned to Me destination");
  await page.evaluate(()=>window.notificationTestSwitch('a'));await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.notificationTestChannels.size),1);
  await page.locator(".header-notification").click();await page.getByText("Recipe waiting for approval",{exact:true}).first().waitFor();
  assert.equal(await page.getByText("Stored title",{exact:true}).count(),0);
  await page.evaluate(()=>window.notificationTestUnmount());await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.notificationTestChannels.size),0);
  pass("account change clears previous user's notices; cleanup removes subscription");
  assert.deepEqual(errors,[]);console.log("ALL LOCAL NOTIFICATION BROWSER TESTS PASSED");
}finally{
  heldResponse?.();await browser.close();await vite.close();await new Promise((resolve)=>api.close(resolve));await db.close();
}
