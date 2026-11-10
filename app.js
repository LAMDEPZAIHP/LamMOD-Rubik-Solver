const FACE_INFO = [
 {id:"U",name:"Trên",color:"#f4f2ed",label:"W"},{id:"R",name:"Phải",color:"#e53935",label:"R"},
 {id:"F",name:"Trước",color:"#22c55e",label:"G"},{id:"D",name:"Dưới",color:"#facc15",label:"Y"},
 {id:"L",name:"Trái",color:"#fb923c",label:"O"},{id:"B",name:"Sau",color:"#3b82f6",label:"B"}
];
const COLOR = Object.fromEntries(FACE_INFO.map(f=>[f.label,f.color]));
const COLOR_NAME = {W:"Trắng",R:"Đỏ",G:"Xanh lá",Y:"Vàng",O:"Cam",B:"Xanh dương"};
const facelets = {};
FACE_INFO.forEach(f=>facelets[f.id]=Array(9).fill(null).map((_,i)=>i===4?f.label:null));
let activeFace="U", activeColor="W", solutionMoves=[], activeStep=0, autoTimer=null;
const el=id=>document.getElementById(id);

function renderTabs(){
 el("faceTabs").innerHTML=FACE_INFO.map(f=>`<button class="face-tab ${f.id===activeFace?"active":""}" data-face="${f.id}">${f.id} · ${f.name}</button>`).join("");
 document.querySelectorAll("[data-face]").forEach(b=>b.addEventListener("click",()=>{activeFace=b.dataset.face;renderAll()}));
}
function renderGrid(){
 el("faceGrid").innerHTML=facelets[activeFace].map((c,i)=>`<button class="sticker ${i===4?"center":""}" data-cell="${i}" style="background:${c?COLOR[c]:"#332d40"}">${c?`<span>${c}</span>`:""}</button>`).join("");
 document.querySelectorAll("[data-cell]").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.cell);if(i===4)return;facelets[activeFace][i]=activeColor;renderAll()}));
}
function renderPalette(){
 el("palette").innerHTML=FACE_INFO.map(f=>`<button class="swatch ${activeColor===f.label?"active":""}" data-color="${f.label}" style="background:${f.color}"><small>${f.label}</small></button>`).join("");
 el("selectedName").textContent=COLOR_NAME[activeColor];
 document.querySelectorAll("[data-color]").forEach(b=>b.addEventListener("click",()=>{activeColor=b.dataset.color;renderPalette()}));
}
function renderCounter(){const n=Object.values(facelets).flat().filter(Boolean).length;el("counter").textContent=`${n} / 54`;}
function renderAll(){renderTabs();renderGrid();renderPalette();renderCounter();window.renderCube3D?.()}
function getFacelets(){return ["U","R","F","D","L","B"].map(f=>facelets[f].join("")).join("")}
function setMessage(message,type=""){el("solverMessage").className=`result ${type}`;el("solverMessage").textContent=message}
async function api(url,options={}){const r=await fetch(url,{headers:{"Content-Type":"application/json"},...options});const d=await r.json();if(!r.ok)throw new Error(d.error||"API request failed");return d}
async function checkHealth(){try{const d=await api("/api/health");el("apiStatus").textContent=d.solverReady?"API ONLINE":"API ONLINE · INIT";el("apiStatus").style.borderColor="#367e60"}catch{el("apiStatus").textContent="API OFFLINE";el("apiStatus").style.borderColor="#a33b60"}}
el("fillFace").onclick=()=>{facelets[activeFace]=Array(9).fill(FACE_INFO.find(f=>f.id===activeFace).label);renderAll()};
el("clearFace").onclick=()=>{facelets[activeFace]=Array(9).fill(null);facelets[activeFace][4]=FACE_INFO.find(f=>f.id===activeFace).label;renderAll()};
el("resetCube").onclick=()=>{FACE_INFO.forEach(f=>facelets[f.id]=Array(9).fill(null).map((_,i)=>i===4?f.label:null));solutionMoves=[];activeStep=0;el("solutionControls").classList.add("hidden");setMessage("Đã đặt lại trạng thái Rubik.");renderAll()};
el("validate").onclick=async()=>{try{const d=await api("/api/validate",{method:"POST",body:JSON.stringify({facelets:getFacelets()})});setMessage("Phân bố màu hợp lệ cơ bản. Mỗi màu xuất hiện đúng 9 lần và tâm đúng vị trí.","success")}catch(e){setMessage(e.message,"error")}};
el("solve").onclick=async()=>{
 const btn=el("solve");btn.disabled=true;btn.textContent="ĐANG TÌM LỜI GIẢI…";setMessage("Đang kiểm tra trạng thái và khởi tạo solver…");
 try{const d=await api("/api/solve",{method:"POST",body:JSON.stringify({facelets:getFacelets()})});solutionMoves=d.moves;activeStep=0;renderSolution();setMessage(d.solved?"Rubik đã ở trạng thái hoàn thành!":`Đã tìm thấy lời giải gồm ${d.moveCount} nước đi. Hãy làm theo thứ tự bên dưới.`,"success")}
 catch(e){setMessage(e.message+" Hãy kiểm tra lại hướng nhìn và màu của cả 6 mặt.","error")}
 finally{btn.disabled=false;btn.textContent="✦ Solve Rubik"}
};
function renderSolution(){
 el("solutionControls").classList.remove("hidden");el("stepLabel").textContent=`Bước ${activeStep} / ${solutionMoves.length}`;el("currentMove").textContent=solutionMoves[activeStep]||"HOÀN THÀNH";
 el("moveList").innerHTML=solutionMoves.map((m,i)=>`<span class="move ${i<activeStep?"done":""} ${i===activeStep?"current":""}">${m}</span>`).join("")||"Đã hoàn thành.";
 el("prevMove").disabled=activeStep===0;el("nextMove").disabled=activeStep>=solutionMoves.length;
}
el("prevMove").onclick=()=>{activeStep=Math.max(0,activeStep-1);renderSolution()};
el("nextMove").onclick=()=>{activeStep=Math.min(solutionMoves.length,activeStep+1);renderSolution()};
el("playMoves").onclick=()=>{if(autoTimer){clearInterval(autoTimer);autoTimer=null;el("playMoves").textContent="▶ Tự chạy";return}el("playMoves").textContent="Ⅱ Tạm dừng";autoTimer=setInterval(()=>{if(activeStep>=solutionMoves.length){clearInterval(autoTimer);autoTimer=null;el("playMoves").textContent="▶ Tự chạy";return}activeStep++;renderSolution()},850)};
el("scramble").onclick=()=>{const faces="URFDLB",suffs=["","'","2"];let last="";const moves=[];while(moves.length<20){const f=faces[Math.floor(Math.random()*6)];if(f===last)continue;last=f;moves.push(f+suffs[Math.floor(Math.random()*3)])}setMessage("Scramble tham khảo: "+moves.join(" ")+" · Hãy xoay khối thật theo chuỗi này rồi nhập trạng thái để giải.")};
async function loadHistory(){try{const d=await api("/api/history");el("history").innerHTML=d.items.length?d.items.slice(0,10).map(x=>`<div class="history-item"><div><b>${x.moveCount} moves</b><br><span>${new Date(x.createdAt).toLocaleString()}</span></div><span>${x.solution||"Solved"}</span></div>`).join(""):"Chưa có lần giải nào."}catch{el("history").textContent="Không tải được lịch sử."}}
el("clearHistory").onclick=async()=>{if(!confirm("Xóa toàn bộ lịch sử trên server?"))return;await api("/api/history",{method:"DELETE"});loadHistory()};
renderAll();checkHealth();loadHistory();setInterval(checkHealth,15000);
