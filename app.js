/* HIMAYATHUL ISLAM MADRASA - frontend */
const CONFIG = {
  API_URL: window.MADRASA_API_URL || "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE",
  BASE_PATH: window.MADRASA_BASE_PATH || ""
};

const state = { user:null, data:{}, route:null };

const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const qs = s => document.querySelector(s);
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

async function api(action, payload={}, method="POST"){
  if(CONFIG.API_URL.includes("PASTE_YOUR")){
    throw new Error("Google Apps Script API URL is not configured. Set window.MADRASA_API_URL in worker.js.");
  }
  const body = JSON.stringify({action, payload, session: localStorage.getItem("madrasa_session") || ""});
  const res = await fetch(CONFIG.API_URL,{method,headers:{"Content-Type":"text/plain;charset=utf-8"},body});
  const json = await res.json();
  if(!json.success) throw new Error(json.message || "API request failed");
  return json.data;
}

function route(){
  const rawPath = location.pathname.replace(/\/+$/,"") || "/"; const p = (CONFIG.BASE_PATH && rawPath.startsWith(CONFIG.BASE_PATH)) ? (rawPath.slice(CONFIG.BASE_PATH.length) || "/") : rawPath;
  const parts = p.split("/").filter(Boolean);
  if(parts[0]==="student") return {name:"student",id:parts[1]||""};
  if(parts[0]==="admin") return {name:"admin"};
  if(parts[0]==="usthad") return {name:"usthad"};
  if(parts[0]==="notices") return {name:"notices"};
  if(parts[0]==="programs") return {name:"programs"};
  return {name:"home"};
}
window.addEventListener("popstate",render);
document.addEventListener("click",e=>{
  const a=e.target.closest("[data-link]");
  if(a){e.preventDefault();history.pushState({}, "", (CONFIG.BASE_PATH||"") + a.dataset.link);render();}
  if(e.target.closest("[data-menu]")) qs(".sidebar")?.classList.toggle("open");
  if(e.target.closest("[data-close]")) qs(".modal")?.remove();
});

function shell(title, content, active=""){
  return `<header class="topbar"><div class="brand"><button class="btn mobile-menu" data-menu>☰</button><div class="mini">HI</div><div><div class="brand-title">HIMAYATHUL ISLAM MADRASA</div><div class="brand-sub">NADUVATHUR · Samastha Reg. No. 737</div></div></div><div class="actions">${state.user?`<span class="badge">${esc(state.user.role)}</span><button class="btn btn-small" onclick="logout()">Logout</button>`:""}</div></header><div class="layout"><aside class="sidebar">${nav(active)}</aside><main class="main">${content}</main></div>`;
}
function nav(active){
  const items = state.user?.role==="ADMIN" ? [
    ["admin","Dashboard"],["students","Students"],["teachers","Usthads"],["classes","Classes"],["attendance","Attendance"],["ce","CE"],["activities","Daily Activities"],["exams","Exams & Results"],["notices","Notices"],["programs","Programs"],["reports","Reports"],["settings","Settings"]
  ] : [["usthad","Dashboard"],["attendance","Attendance"],["ce","CE"],["activities","Daily Activities"],["exams","Exams & Results"],["notices","Notices"]];
  return `<div class="nav-title">Menu</div>${items.map(([k,l])=>`<button class="nav-btn ${active===k?"active":""}" data-link="/${k}">${l}</button>`).join("")}`;
}

function loginPage(){
  return `<div class="login-page"><form class="login-card" id="loginForm"><div class="brand-mark">HI</div><h1>HIMAYATHUL ISLAM MADRASA</h1><p>Secure Web Portal · Naduvathur</p><div class="field"><label>Username</label><input name="username" required autocomplete="username"></div><div class="field" style="margin-top:12px"><label>Password</label><input name="password" type="password" required autocomplete="current-password"></div><div id="loginErr" class="error hidden" style="margin-top:12px"></div><button class="btn btn-primary" style="width:100%;margin-top:15px">Login</button><div class="login-help">Student pages are opened through the student's unique QR/URL. Students do not receive access to teacher/admin records.</div></form></div>`;
}

async function render(){
  const r=route(); state.route=r;
  if(r.name==="student") return renderStudent(r.id);
  if(["admin","usthad"].includes(r.name)){
    if(!state.user) { qs("#app").innerHTML=loginPage(); qs("#loginForm").onsubmit=doLogin; return; }
    return renderDashboard(r.name);
  }
  if(r.name==="home"){
    if(state.user) return renderDashboard(state.user.role==="ADMIN"?"admin":"usthad");
    qs("#app").innerHTML=`<div class="login-page"><div class="login-card"><div class="brand-mark">HI</div><h1>HIMAYATHUL ISLAM MADRASA</h1><p>NADUVATHUR · Samastha Registration No: 737</p><div class="actions"><a class="btn btn-primary" href="/admin" data-link="/admin">Admin / Usthad Login</a><a class="btn" href="/notices" data-link="/notices">Public Notices</a></div><div class="login-help">Student QR links open the student's permitted page directly.</div></div></div>`; return;
  }
  if(!state.user){history.replaceState({}, "", "/");return render();}
  return renderDashboard(r.name);
}

async function doLogin(e){
  e.preventDefault(); const f=new FormData(e.target); const err=qs("#loginErr");
  try{ const d=await api("login",{username:f.get("username"),password:f.get("password")}); localStorage.setItem("madrasa_session",d.session); state.user=d.user; history.pushState({}, "", d.user.role==="ADMIN"?"/admin":"/usthad"); render();}
  catch(x){err.textContent=x.message;err.classList.remove("hidden");}
}
function logout(){localStorage.removeItem("madrasa_session");state.user=null;history.pushState({}, "", "/");render();}

async function renderStudent(studentId){
  qs("#app").innerHTML=`<div class="login-page"><div class="login-card"><div class="brand-mark">HI</div><h1>Student Portal</h1><p>Loading student profile…</p></div></div>`;
  try{
    const d=await api("student.getPage",{student_id:studentId});
    qs("#app").innerHTML=studentHtml(d);
  }catch(e){
    qs("#app").innerHTML=`<div class="login-page"><div class="login-card"><div class="error">Student page could not be loaded.<br>${esc(e.message)}</div><a class="btn" href="/">Go Home</a></div></div>`;
  }
}
function studentHtml(d){
  const s=d.student||{}; const programs=d.programs||[]; const notices=d.notices||[]; const messages=d.messages||[];
  const prayers=d.today?.prayer||[]; const activities=d.today?.activities||[]; const attendance=d.last_completed_attendance;
  return `<div class="main" style="max-width:1200px;margin:auto">
    <div class="student-hero"><div><div style="opacity:.8;font-size:12px">HIMAYATHUL ISLAM MADRASA · NADUVATHUR</div><div class="student-name">${esc(s.name)}</div><div class="student-meta">Register No: ${esc(s.register_number)} · Class: ${esc(s.class_name)}</div></div><div class="student-id">${esc(s.student_id)}</div></div>
    <div class="grid grid-3" style="margin-top:16px">
      <div class="card"><div class="stat"><div><div class="label">Register Number</div><div class="value" style="font-size:19px">${esc(s.register_number)}</div></div></div></div>
      <div class="card"><div class="stat"><div><div class="label">Class</div><div class="value" style="font-size:19px">${esc(s.class_name)}</div></div></div></div>
      <div class="card"><div class="stat"><div><div class="label">Student ID</div><div class="value" style="font-size:19px">${esc(s.student_id)}</div></div></div></div>
    </div>
    <div class="section-title">Notices</div>${notices.length?`<div class="grid grid-2">${notices.map(n=>`<div class="card notice-card"><span class="badge">${esc(n.target_type)}</span><h3>${esc(n.title)}</h3><p>${esc(n.description)}</p><div class="kpi-note">${fmtDate(n.start_date)}</div></div>`).join("")}</div>`:`<div class="empty">No notices to show.</div>`}
    <div class="section-title">Usthad Messages</div>${messages.length?`<div class="grid grid-2">${messages.map(m=>`<div class="card notice-card"><h3>${esc(m.title||"Teacher Message")}</h3><p>${esc(m.message)}</p><div class="kpi-note">${fmtDate(m.created_at)}</div></div>`).join("")}</div>`:`<div class="empty">No messages to show.</div>`}
    <div class="section-title">Today's Report</div><div class="grid grid-2">
      <div class="card"><h3>Prayer</h3>${prayers.length?`<div class="table-wrap"><table class="table"><tr><th>Prayer</th><th>Status</th></tr>${prayers.map(x=>`<tr><td>${esc(x.prayer)}</td><td><span class="badge success">${esc(x.status)}</span></td></tr>`).join("")}</table></div>`:`<div class="empty">No prayer record for today.</div>`}</div>
      <div class="card"><h3>Activities</h3>${activities.length?`<div class="table-wrap"><table class="table"><tr><th>Activity</th><th>Portion</th><th>Note</th></tr>${activities.map(x=>`<tr><td>${esc(x.activity_type)}</td><td>${esc(x.portion)}</td><td>${esc(x.teacher_note)}</td></tr>`).join("")}</table></div>`:`<div class="empty">No activity record for today.</div>`}</div>
    </div>
    <div class="section-title">Prayer Entry</div><div class="card"><p style="margin-top:0;color:#667085;font-size:13px">After 5:00 AM, you can mark the permitted previous-day prayers and current-day Fajr.</p><div class="actions">${["ZUHR","ASR","MAGHRIB","ISHA","FAJR"].map(p=>`<button class="btn ${prayers.some(x=>x.prayer===p)?"btn-primary":""}" onclick="submitPrayer('${esc(s.student_id)}','${p}')">${p}</button>`).join("")}</div></div>
    <div class="section-title">Last Completed Month Attendance</div>${attendance?`<div class="grid grid-4"><div class="card"><div class="stat"><div><div class="label">Month</div><div class="value" style="font-size:19px">${esc(attendance.month_label)}</div></div></div></div><div class="card"><div class="stat"><div><div class="label">Working Days</div><div class="value">${attendance.working_days}</div></div></div></div><div class="card"><div class="stat"><div><div class="label">Attended</div><div class="value">${attendance.attended_days}</div></div></div></div><div class="card"><div class="stat"><div><div class="label">Attendance</div><div class="value">${Number(attendance.percentage).toFixed(2)}%</div><div class="kpi-note">Absent: ${attendance.absent_days}</div></div></div></div></div>`:`<div class="empty">No completed-month attendance record.</div>`}
    <div class="section-title">Results</div><div class="card"><p style="margin-top:0;color:#667085">Published exam results are available in the results page.</p><a class="btn btn-primary" href="/student/${encodeURIComponent(s.student_id)}/results">VIEW RESULTS</a></div>
    ${programs.length?`<div class="section-title">Programs & Activities</div><div class="grid grid-2">${programs.map(programCard).join("")}</div>`:""}
  </div>`;
}
function programCard(p){return `<div class="card program-card">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:""}<div class="grow"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></div><a class="btn btn-primary btn-small" target="_blank" rel="noopener noreferrer" href="${esc(p.button_url)}">${esc(p.button_text||"Open")}</a></div>`}
async function submitPrayer(studentId,prayer){
  try{await api("student.prayer",{student_id:studentId,prayer,date:today()}); alert("Prayer entry saved."); renderStudent(studentId);}catch(e){alert(e.message)}
}

async function renderDashboard(kind){
  const active=state.route.name;
  qs("#app").innerHTML=shell("Dashboard",`<div class="page-head"><div><h1>${kind==="admin"?"Admin Dashboard":"Usthad Dashboard"}</h1><p>Secure management portal</p></div></div><div id="dashContent"><div class="empty">Loading…</div></div>`,active);
  try{
    const d=await api(kind==="admin"?"admin.dashboard":"usthad.dashboard",{});
    qs("#dashContent").innerHTML=`<div class="grid grid-4">${(d.stats||[]).map(x=>`<div class="card"><div class="stat"><div><div class="label">${esc(x.label)}</div><div class="value">${esc(x.value)}</div></div><div class="stat-icon">+</div></div></div>`).join("")}</div>
    <div class="section-title">Quick Actions</div><div class="card actions">
      ${kind==="admin"?`<button class="btn" data-link="/students">Students</button><button class="btn" data-link="/teachers">Usthads</button><button class="btn" data-link="/classes">Classes</button><button class="btn" data-link="/attendance">Attendance</button><button class="btn" data-link="/ce">CE</button><button class="btn" data-link="/activities">Daily Activities</button><button class="btn" data-link="/exams">Exams & Results</button><button class="btn" data-link="/notices">Notices</button><button class="btn" data-link="/programs">Programs</button><button class="btn" data-link="/reports">Reports</button><button class="btn" data-link="/settings">Settings</button>`:
      `<button class="btn" data-link="/attendance">Attendance</button><button class="btn" data-link="/ce">CE</button><button class="btn" data-link="/activities">Daily Activities</button><button class="btn" data-link="/exams">Exams & Results</button><button class="btn" data-link="/notices">Notices</button>`}
    </div>`;
  }catch(e){qs("#dashContent").innerHTML=`<div class="error">${esc(e.message)}</div>`}
}

const PAGE_MAP={
  students:{title:"Students",action:"students.list",create:"students.create",fields:[
    ["student_id","Student ID"],["register_number","Register Number"],["name","Name"],["guardian","Father / Guardian"],["dob","DOB","date"],["phone","Phone"],["class_id","Class ID"],["admission_date","Admission Date","date"],["status","Status"]
  ]},
  teachers:{title:"Usthads / Teachers",action:"teachers.list",create:"teachers.create",fields:[
    ["teacher_id","Teacher ID"],["name","Name"],["phone","Phone"],["username","Username"],["password","Password","password"],["status","Status"]
  ]},
  classes:{title:"Classes",action:"classes.list",create:"classes.create",fields:[
    ["class_id","Class ID"],["name","Class Name"],["status","Status"]
  ]},
  attendance:{title:"Monthly Attendance",action:"attendance.list",create:"attendance.save",fields:[
    ["student_id","Student ID"],["month","Month (YYYY-MM)"],["working_days","Working Days","number"],["attended_days","Attended Days","number"]
  ]},
  ce:{title:"CE Evaluation",action:"ce.list",create:"ce.save",fields:[
    ["student_id","Student ID"],["month","Month (YYYY-MM)"],["prayer","Prayer","number"],["character","Character","number"],["dress","Dress","number"],["cleanliness","Cleanliness","number"],["quran","Quran","number"],["hifz","Hifz","number"],["other","Other","number"],["final_mark","Final CE Mark","number"],["teacher_remark","Teacher Remark"]
  ]},
  activities:{title:"Daily Activities",action:"activities.list",create:"activities.save",fields:[
    ["date","Date","date"],["student_id","Student ID"],["class_id","Class ID"],["activity_type","Activity Type"],["portion","Portion / Lesson"],["status","Status"],["teacher_note","Teacher Note"]
  ]},
  exams:{title:"Exams & Results",action:"exams.list",create:"exams.create",fields:[
    ["title","Exam Title"],["exam_type","Exam Type"],["start_date","Start Date","date"],["end_date","End Date","date"],["status","Status"],["published","Published (YES/NO)"]
  ]},
  notices:{title:"Notices",action:"notices.list",create:"notices.create",fields:[
    ["title","Title"],["description","Description","textarea"],["image_url","Image URL"],["pdf_url","PDF URL"],["target_type","Target (WHOLE_MADRASA / CLASS / STUDENT)"],["target_class_id","Target Class ID"],["target_student_id","Target Student ID"],["start_date","Start Date","date"],["expiry_date","Expiry Date","date"],["published","Published (YES/NO)"]
  ]},
  programs:{title:"Programs / Custom Sections",action:"programs.list",create:"programs.create",fields:[
    ["title","Title"],["description","Short Description","textarea"],["image_url","Poster / Image URL"],["button_text","Button Text"],["button_url","Button Link (HTTPS)"],["target_type","Target (WHOLE_MADRASA / CLASS / STUDENT)"],["target_class_id","Target Class ID"],["target_student_id","Target Student ID"],["start_date","Start Date","date"],["end_date","End Date","date"],["display_order","Display Order","number"],["status","Status (ACTIVE / INACTIVE)"]
  ]}
};

async function renderManagement(name){
  const cfg=PAGE_MAP[name];
  if(!cfg){ return renderSimplePage(name); }
  qs("#app").innerHTML=shell(cfg.title,`<div class="page-head"><div><h1>${cfg.title}</h1><p>API-driven records from Google Sheets</p></div><button class="btn btn-primary" id="addBtn">Add New</button></div><div id="pageBody"><div class="empty">Loading…</div></div>`,name);
  qs("#addBtn").onclick=()=>openForm(cfg);
  try{
    const d=await api(cfg.action,{});
    const list=Array.isArray(d)?d:(d.items||d.records||[]);
    const cols=cfg.fields.map(f=>f[0]);
    qs("#pageBody").innerHTML=list.length?`<div class="card table-wrap"><table class="table"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}<th>Action</th></tr></thead><tbody>${list.map((r,i)=>`<tr>${cols.map(c=>`<td>${esc(r[c])}</td>`).join("")}<td><button class="btn btn-small" onclick='editRecord(${JSON.stringify(name)},${JSON.stringify(r)})'>Edit</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No records found.</div>`;
  }catch(e){qs("#pageBody").innerHTML=`<div class="error">${esc(e.message)}</div>`}
}
function openForm(cfg,record={}){
  const fields=cfg.fields.map(([key,label,type])=>`<div class="field ${type==="textarea"?"full":""}"><label>${esc(label)}</label>${type==="textarea"?`<textarea name="${esc(key)}" rows="4">${esc(record[key])}</textarea>`:`<input name="${esc(key)}" type="${type||"text"}" value="${esc(record[key])}" ${key==="password"?"autocomplete=\"new-password\"":""}>`}</div>`).join("");
  qs("#app").insertAdjacentHTML("beforeend",`<div class="modal"><div class="modal-box"><div class="modal-head"><h2>${record._edit?"Edit":"Add"} ${esc(cfg.title)}</h2><button class="btn" data-close>×</button></div><form id="crudForm" data-action="${esc(record._edit?cfg.action.replace(".list",".update"):cfg.create)}"><div class="form-grid">${fields}</div><div class="actions" style="margin-top:16px"><button class="btn btn-primary">Save</button><button type="button" class="btn" data-close>Cancel</button></div></form></div></div>`);
  if(record._edit) qs("#crudForm").dataset.originalId=record.student_id||record.teacher_id||record.class_id||record.program_id||record.notice_id||record.exam_id||"";
}
function editRecord(name,r){r._edit=true;openForm(PAGE_MAP[name],r)}
async function renderSimplePage(name){
  const titles={reports:"Reports",settings:"Settings"};
  qs("#app").innerHTML=shell(titles[name]||name,`<div class="page-head"><div><h1>${esc(titles[name]||name)}</h1><p>Management section</p></div></div><div class="card"><div class="empty">This section is connected to the shared API. Add its API actions in Code.gs before enabling operational use.</div></div>`,name);
}

const originalRender=render;
render=async function(){
  const r=route(); state.route=r;
  if(PAGE_MAP[r.name] && state.user) return renderManagement(r.name);
  return originalRender();
};

document.addEventListener("submit",async e=>{
  if(e.target.id==="crudForm"){
    e.preventDefault(); const form=e.target; const obj=Object.fromEntries(new FormData(form).entries());
    if(form.dataset.originalId) obj.original_id=form.dataset.originalId;
    try{await api(form.dataset.action,obj); qs(".modal")?.remove(); alert("Saved successfully."); render();}catch(x){alert(x.message)}
  }
});

window.addEventListener("load",render);
