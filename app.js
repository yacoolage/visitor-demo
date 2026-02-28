const STAGES = ["预约", "预检", "签到", "在场", "签退", "沉淀"];

const initialVisitors = [
  { id: "V-202601-001", name: "王伟", company: "星辰科技", host: "李娜", purpose: "客户需求评审", visitorType: "客户", time: "09:30", stageIndex: 1, approved: false, expectedLeave: "11:30", extensionMinutes: 0, status: "pending", precheck: "待完成" },
  { id: "V-202601-002", name: "陈琳", company: "远航咨询", host: "赵晨", purpose: "项目复盘", visitorType: "合作方", time: "10:00", stageIndex: 2, approved: true, expectedLeave: "12:00", extensionMinutes: 0, status: "approved", precheck: "通过" },
  { id: "V-202601-003", name: "刘畅", company: "求职者", host: "HR-王敏", purpose: "面试", visitorType: "面试", time: "10:30", stageIndex: 3, approved: true, expectedLeave: "11:30", extensionMinutes: 0, status: "invisit", precheck: "通过" },
  { id: "V-202601-004", name: "张鹏", company: "速达快递", host: "行政前台", purpose: "快递交付", visitorType: "配送", time: "09:10", stageIndex: 4, approved: true, expectedLeave: "09:20", extensionMinutes: 0, status: "checkedout", precheck: "通过" },
];

const state = {
  visitors: structuredClone(initialVisitors),
  selectedId: initialVisitors[0].id,
  logs: ["系统初始化完成，已加载 4 条 mock 访客记录。", "王伟已完成信息录入，等待审批。"],
  activeScene: "dashboard",
};

const el = {
  visitorList: document.getElementById("visitorList"), pipeline: document.getElementById("pipeline"),
  eventLog: document.getElementById("eventLog"), metrics: document.getElementById("metrics"),
  detail: document.getElementById("visitorDetail"), hint: document.getElementById("actionHint"),
  approveBtn: document.getElementById("approveBtn"), checkInBtn: document.getElementById("checkInBtn"),
  enterZoneBtn: document.getElementById("enterZoneBtn"), delayBtn: document.getElementById("delayBtn"),
  checkOutBtn: document.getElementById("checkOutBtn"), markExceptionBtn: document.getElementById("markExceptionBtn"),
  resetBtn: document.getElementById("resetBtn"), sceneTabs: document.getElementById("sceneTabs"),
  reservationForm: document.getElementById("reservationForm"), reservationTable: document.getElementById("reservationTable"),
  precheckTable: document.getElementById("precheckTable"), checkinTable: document.getElementById("checkinTable"),
  zoneCards: document.getElementById("zoneCards"), checkoutTable: document.getElementById("checkoutTable"),
  kpiGrid: document.getElementById("kpiGrid"), typeStats: document.getElementById("typeStats"), exceptionTable: document.getElementById("exceptionTable"),
};

const sceneIds = ["dashboard", "reservation", "precheck", "checkin", "invisit", "checkout", "analytics", "exception"];

function getSelectedVisitor() { return state.visitors.find((v) => v.id === state.selectedId) || state.visitors[0]; }
function pushLog(msg) {
  const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  state.logs.unshift(`${now}｜${msg}`);
  state.logs = state.logs.slice(0, 30);
}
function statusBadge(v) {
  if (v.status === "exception") return ["异常", "exception"];
  if (v.stageIndex >= 4) return ["已签退", "checkedout"];
  if (v.stageIndex >= 3) return ["在场中", "invisit"];
  if (v.approved) return ["已审批", "approved"];
  return ["待审批", "pending"];
}
function setScene(scene) {
  state.activeScene = scene;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.scene === scene));
  sceneIds.forEach((id) => document.getElementById(`scene-${id}`).classList.toggle("active", id === scene));
}

function renderVisitorList() {
  el.visitorList.innerHTML = "";
  state.visitors.forEach((v) => {
    const [txt, cls] = statusBadge(v);
    const item = document.createElement("div");
    item.className = `visitor-item ${v.id === state.selectedId ? "active" : ""}`;
    item.innerHTML = `<div><strong>${v.name}</strong> · ${v.visitorType}</div><div>${v.company}</div><div>被访人：${v.host}</div><div>预约时间：${v.time}</div><span class="badge ${cls}">${txt}</span>`;
    item.onclick = () => { state.selectedId = v.id; render(); };
    el.visitorList.appendChild(item);
  });
}
function renderPipeline() {
  const v = getSelectedVisitor();
  el.pipeline.innerHTML = "";
  STAGES.forEach((stage, idx) => {
    const step = document.createElement("div");
    let cls = "step";
    if (idx < v.stageIndex) cls += " done";
    if (idx === v.stageIndex) cls += " current";
    if (v.status === "exception") cls = "step";
    step.className = cls; step.textContent = stage; el.pipeline.appendChild(step);
  });
}
function renderMetrics() {
  const total = state.visitors.length;
  const inVisit = state.visitors.filter((v) => v.stageIndex === 3).length;
  const checkedOut = state.visitors.filter((v) => v.stageIndex >= 4).length;
  const exceptions = state.visitors.filter((v) => v.status === "exception").length;
  const approvalRate = Math.round((state.visitors.filter((v) => v.approved).length / total) * 100);
  const conversion = Math.round((state.visitors.filter((v) => v.stageIndex >= 2).length / total) * 100);
  const cards = [["今日预约", total], ["当前在场", inVisit], ["已签退", checkedOut], ["异常数", exceptions], ["审批通过率", `${approvalRate}%`], ["预约转签到率", `${conversion}%`]];
  el.metrics.innerHTML = cards.map(([l, v]) => `<div class="metric-card"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");
}
function renderDetail() {
  const v = getSelectedVisitor();
  el.detail.innerHTML = `<div><strong>${v.name}</strong>（${v.id}）</div><div>公司：${v.company}</div><div>访客类型：${v.visitorType}</div><div>被访人：${v.host}</div><div>来访事由：${v.purpose}</div><div>预检状态：${v.precheck}</div><div>预计离场：${v.expectedLeave}</div><div>已延时：${v.extensionMinutes} 分钟</div><div>当前节点：${STAGES[v.stageIndex]}</div>`;
}
function renderLogs() { el.eventLog.innerHTML = state.logs.map((x) => `<li>${x}</li>`).join(""); }
function refreshActionState() {
  const v = getSelectedVisitor(); const ex = v.status === "exception";
  el.approveBtn.disabled = v.approved || ex;
  el.checkInBtn.disabled = !v.approved || v.stageIndex > 2 || ex;
  el.enterZoneBtn.disabled = v.stageIndex !== 2 || ex;
  el.delayBtn.disabled = v.stageIndex !== 3 || ex;
  el.checkOutBtn.disabled = v.stageIndex < 3 || v.stageIndex > 4 || ex;
  el.markExceptionBtn.disabled = ex || v.stageIndex >= 4;
  el.hint.textContent = `${v.name} 当前处于「${STAGES[v.stageIndex]}」阶段。`;
}

function tableHtml(headers, rows) {
  return `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
function renderReservation() {
  const rows = state.visitors.map((v) => [v.id, v.name, v.visitorType, v.host, v.time, STAGES[v.stageIndex]]);
  el.reservationTable.innerHTML = tableHtml(["预约单号", "访客", "类型", "被访人", "预约时间", "进度"], rows);
}
function renderPrecheck() {
  const rows = state.visitors.map((v) => [v.name, v.company, v.precheck, v.approved ? "通过" : "待审批", v.status === "exception" ? "命中异常" : "正常"]);
  el.precheckTable.innerHTML = tableHtml(["访客", "公司", "预检", "审批", "风控结果"], rows);
}
function renderCheckin() {
  const rows = state.visitors.map((v) => [v.name, v.time, v.stageIndex >= 2 ? "已签到" : "未签到", v.stageIndex >= 2 ? "二维码" : "-", v.approved ? "通过" : "待审批"]);
  el.checkinTable.innerHTML = tableHtml(["访客", "预约时间", "签到状态", "签到方式", "核验结果"], rows);
}
function renderInvisit() {
  const inVisit = state.visitors.filter((v) => v.stageIndex === 3);
  if (!inVisit.length) { el.zoneCards.innerHTML = '<div class="zone-card">当前无在场访客</div>'; return; }
  el.zoneCards.innerHTML = inVisit.map((v) => `<div class="zone-card"><strong>${v.name}</strong><div>${v.company}</div><div>访问区域：办公区A</div><div>被访人：${v.host}</div><div>延时：${v.extensionMinutes} 分钟</div></div>`).join("");
}
function renderCheckout() {
  const rows = state.visitors.map((v) => [v.name, v.expectedLeave, v.stageIndex >= 4 ? "已签退" : "未签退", v.stageIndex >= 4 ? "权限已回收" : "权限有效"]);
  el.checkoutTable.innerHTML = tableHtml(["访客", "预计离场", "签退状态", "门禁状态"], rows);
}
function renderAnalytics() {
  const total = state.visitors.length;
  const onTimeRate = Math.round((state.visitors.filter((v) => v.stageIndex >= 4).length / total) * 100);
  const exceptionClose = Math.max(90 - state.visitors.filter((v) => v.status === "exception").length * 10, 50);
  const kpis = [["平均签到耗时", "43秒"], ["预约转签到率", `${Math.round((state.visitors.filter((v) => v.stageIndex >= 2).length / total) * 100)}%`], ["准时签退率", `${onTimeRate}%`], ["异常闭环率", `${exceptionClose}%`]];
  el.kpiGrid.innerHTML = kpis.map(([l, v]) => `<div class="metric-card"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");

  const counter = {};
  state.visitors.forEach((v) => { counter[v.visitorType] = (counter[v.visitorType] || 0) + 1; });
  el.typeStats.innerHTML = Object.entries(counter).map(([k, v]) => `<div class="type-item"><strong>${k}</strong><div>${v} 人次</div></div>`).join("");
}
function renderException() {
  const data = state.visitors.filter((v) => v.status === "exception");
  const rows = data.length ? data.map((v) => [v.name, "信息不一致", "前台人工核验", "处理中"]) : [["-", "-", "-", "当前无异常"]];
  el.exceptionTable.innerHTML = tableHtml(["访客", "异常类型", "处理动作", "状态"], rows);
}

function render() {
  renderVisitorList(); renderPipeline(); renderMetrics(); renderDetail(); renderLogs(); refreshActionState();
  renderReservation(); renderPrecheck(); renderCheckin(); renderInvisit(); renderCheckout(); renderAnalytics(); renderException();
}

el.sceneTabs.onclick = (e) => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  setScene(tab.dataset.scene);
};

el.reservationForm.onsubmit = (e) => {
  e.preventDefault();
  const id = `V-202601-${String(state.visitors.length + 1).padStart(3, "0")}`;
  const item = {
    id,
    name: document.getElementById("fName").value,
    company: document.getElementById("fCompany").value,
    visitorType: document.getElementById("fType").value,
    host: document.getElementById("fHost").value,
    time: document.getElementById("fTime").value,
    expectedLeave: document.getElementById("fLeave").value,
    purpose: document.getElementById("fPurpose").value,
    stageIndex: 0,
    approved: false,
    extensionMinutes: 0,
    status: "pending",
    precheck: "待完成",
  };
  state.visitors.push(item);
  state.selectedId = id;
  pushLog(`${item.name} 新增预约成功，等待预检与审批。`);
  el.reservationForm.reset();
  render();
};

el.approveBtn.onclick = () => { const v = getSelectedVisitor(); v.approved = true; if (v.stageIndex < 2) v.stageIndex = 2; v.precheck = "通过"; v.status = "approved"; pushLog(`${v.name} 审批通过，已可签到。`); render(); };
el.checkInBtn.onclick = () => { const v = getSelectedVisitor(); if (v.stageIndex < 2) v.stageIndex = 2; v.status = "approved"; pushLog(`${v.name} 完成签到。`); render(); };
el.enterZoneBtn.onclick = () => { const v = getSelectedVisitor(); v.stageIndex = 3; v.status = "invisit"; pushLog(`${v.name} 进入在场状态。`); render(); };
el.delayBtn.onclick = () => { const v = getSelectedVisitor(); v.extensionMinutes += 30; pushLog(`${v.name} 延时 30 分钟已通过。`); render(); };
el.checkOutBtn.onclick = () => { const v = getSelectedVisitor(); v.stageIndex = 4; v.status = "checkedout"; pushLog(`${v.name} 已签退，门禁权限回收。`); render(); };
el.markExceptionBtn.onclick = () => { const v = getSelectedVisitor(); v.status = "exception"; v.precheck = "失败"; pushLog(`${v.name} 标记异常并转人工处理。`); render(); };
el.resetBtn.onclick = () => { state.visitors = structuredClone(initialVisitors); state.selectedId = state.visitors[0].id; state.logs = ["系统已重置为初始 mock 数据。"]; setScene("dashboard"); render(); };

setScene("dashboard");
render();
