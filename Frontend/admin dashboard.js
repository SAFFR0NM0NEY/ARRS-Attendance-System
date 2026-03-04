// Sidebar switching
const sidebarItems = document.querySelectorAll(".sidebar .icon-item");
const sections = document.querySelectorAll("main section");

function showSection(id){
  sections.forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// Main Tabs
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
tabButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    tabButtons.forEach(b=>b.classList.remove("active"));
    tabContents.forEach(c=>c.style.display="none");
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).style.display="block";
  });
});
document.getElementById("cyber").style.display="block";

// Nested / Mini Tabs
const miniButtons = document.querySelectorAll(".mini-tab");
const miniContents = document.querySelectorAll(".mini-content");
miniButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    miniButtons.forEach(b=>b.classList.remove("active"));
    miniContents.forEach(c=>c.style.display="none");
    btn.classList.add("active");
    document.getElementById(btn.dataset.mini).style.display="block";
  });
});

// Calendar
const monthYear = document.getElementById("monthYear");
const calendarDays = document.getElementById("calendarDays");
const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");
const modal = document.getElementById("eventModal");
const selectedDate = document.getElementById("selectedDate");
const closeModal = document.getElementById("closeModal");

let date = new Date();

function renderCalendar() {
  const year = date.getFullYear();
  const month = date.getMonth();
  monthYear.innerText = date.toLocaleString("default",{month:"long",year:"numeric"});
  calendarDays.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month+1,0).getDate();

  for(let i=0;i<firstDay;i++){calendarDays.innerHTML+="<div class='empty'></div>";}
  for(let d=1;d<=lastDate;d++){
    const div = document.createElement("div");
    div.className="day";
    div.innerText=d;
    div.onclick=()=>openModal(d, month+1, year);
    calendarDays.appendChild(div);
  }
}

prevMonth.onclick = ()=>{ date.setMonth(date.getMonth()-1); renderCalendar(); };
nextMonth.onclick = ()=>{ date.setMonth(date.getMonth()+1); renderCalendar(); };

function openModal(day, month, year){
  modal.style.display="flex";
  selectedDate.innerText=`${day}/${month}/${year}`;
}
closeModal.onclick=()=>modal.style.display="none";

renderCalendar();