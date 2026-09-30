const HISTORY_KEY = "samCalculatorHistoryV3";

const pages = ["dashboard","spray","water","area","history","guide"];

function showPage(pageId){
  pages.forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.classList.toggle("active",id===pageId);
  });
  if(pageId==="history") renderHistory();
  window.scrollTo({top:0,behavior:"smooth"});
}

function setSprayMode(mode){
  const a=mode==="a";
  document.getElementById("tabA").classList.toggle("active",a);
  document.getElementById("tabB").classList.toggle("active",!a);
  document.getElementById("formA").classList.toggle("hidden",!a);
  document.getElementById("formB").classList.toggle("hidden",a);
}

function num(id){
  return parseFloat(document.getElementById(id).value);
}

function validPositive(values){
  return values.every(v=>Number.isFinite(v) && v>0);
}

function formatNumber(value, digits=2){
  return new Intl.NumberFormat("fa-IR",{maximumFractionDigits:digits}).format(value);
}

function nowFa(){
  return new Intl.DateTimeFormat("fa-IR",{dateStyle:"short",timeStyle:"short"}).format(new Date());
}

function saveHistory(type,value,detail){
  const history=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  history.unshift({type,value,detail,date:nowFa()});
  localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,50)));
}

function calculateA(){
  const tank=num("tankA"), dose=num("doseA");
  if(!validPositive([tank,dose])){
    showToast("⚠️ حجم مخزن و مقدار توصیه‌شده باید بیشتر از صفر باشند.");
    return;
  }
  const pure=(tank*dose)/1000;
  const text=`مقدار سم خالص: ${formatNumber(pure)} سی‌سی`;
  setResult("resultA","✅ "+text);
  saveHistory("غلظتی",text,`مخزن ${formatNumber(tank)} لیتر — دوز ${formatNumber(dose)} سی‌سی`);
}

function calculateB(){
  const tank=num("tankB"), dose=num("doseB"), width=num("widthB"), speed=num("speedB"), flow30=num("flowB");
  if(!validPositive([tank,dose,width,speed,flow30])){
    showToast("⚠️ همه مقادیر باید بیشتر از صفر باشند.");
    return;
  }
  const pure=(dose*tank*width*speed)/(10000*flow30);
  const text=`مقدار سم خالص: ${formatNumber(pure)} کیلوگرم یا لیتر`;
  setResult("resultB","✅ "+text);
  saveHistory("هکتاری",text,`مخزن ${formatNumber(tank)} لیتر — دوز ${formatNumber(dose)} — عرض ${formatNumber(width)} متر — سرعت ${formatNumber(speed)} — دبی ${formatNumber(flow30)}`);
}

function calculateWater(){
  const dose=num("waterDose"), rate=num("waterRate");
  if(!validPositive([dose,rate])){
    showToast("⚠️ مقدار سم و غلظت باید بیشتر از صفر باشند.");
    return;
  }
  // dose is in liters/kg and rate is per-thousand; consistent with the app's original convention:
  const water=(dose*1000/rate)-dose;
  if(water<0){
    showToast("⚠️ مقدار واردشده برای این غلظت معتبر نیست.");
    return;
  }
  const text=`آب موردنیاز: ${formatNumber(water)} لیتر`;
  setResult("waterResult","💧 "+text);
  saveHistory("آب موردنیاز",text,`سم خالص ${formatNumber(dose)} — غلظت ${formatNumber(rate)} در هزار`);
}

function toggleAreaMethod(){
  const square=document.getElementById("areaMethod").value==="square";
  document.getElementById("areaWidthWrap").classList.toggle("hidden",square);
}

function calculateArea(){
  const method=document.getElementById("areaMethod").value;
  const length=num("areaLength");
  const width=method==="square"?length:num("areaWidth");
  if(!validPositive([length,width])){
    showToast("⚠️ طول و عرض باید بیشتر از صفر باشند.");
    return;
  }
  const sqm=length*width;
  const hectare=sqm/10000;
  const text=`مساحت: ${formatNumber(sqm)} مترمربع — ${formatNumber(hectare)} هکتار`;
  setResult("areaResult","🚜 "+text);
  saveHistory("مساحت زمین",text,method==="square"?`مربع با ضلع ${formatNumber(length)} متر`:`طول ${formatNumber(length)} متر — عرض ${formatNumber(width)} متر`);
}

function setResult(id,text){
  const el=document.getElementById(id);
  el.textContent=text;
  el.classList.remove("hidden");
}

function renderHistory(){
  const list=document.getElementById("historyList");
  const history=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  if(!history.length){
    list.innerHTML='<div class="history-empty">هنوز محاسبه‌ای ذخیره نشده است.</div>';
    return;
  }
  list.innerHTML=history.map(item=>`
    <div class="history-item">
      <div class="history-type">${escapeHtml(item.type)}</div>
      <div class="history-date">${escapeHtml(item.date)}</div>
      <div class="history-value">${escapeHtml(item.value)}</div>
      <div class="history-detail">${escapeHtml(item.detail)}</div>
    </div>
  `).join("");
}

function clearHistory(){
  if(!confirm("همه سوابق محاسبات از این دستگاه حذف شود؟")) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast("سابقه محاسبات پاک شد.");
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

const helpTexts={
  dose:{
    title:"راهنمای مقدار توصیه‌شده",
    text:"اگر روی سم نوشته «۲ در هزار»، عدد ۲۰۰۰ را وارد کنید؛ یعنی ۲۰۰۰ سی‌سی سم در ۱۰۰۰ لیتر آب."
  },
  speed:{
    title:"راهنمای سرعت حرکت",
    text:"مسافتی را که دستگاه در ۳۰ ثانیه طی می‌کند بر حسب متر اندازه بگیرید و همان عدد را وارد کنید."
  },
  nozzle:{
    title:"راهنمای جمع دبی نازل‌ها",
    text:"دبی تمام نازل‌ها را در یک بازه ۳۰ ثانیه‌ای اندازه‌گیری کنید و مجموع آنها را بر حسب لیتر وارد کنید."
  }
};

function openHelp(key){
  const item=helpTexts[key];
  document.getElementById("modalContent").innerHTML=`<h3>${item.title}</h3><p>${item.text}</p>`;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal(){
  document.getElementById("modal").classList.add("hidden");
}

function showToast(message){
  const toast=document.getElementById("toast");
  toast.textContent=message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>toast.classList.remove("show"),2800);
}

document.addEventListener("keydown",e=>{
  if(e.key==="Escape") closeModal();
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("./sw.js").catch(err=>console.log("Service Worker:",err));
  });
}

showPage("dashboard");
