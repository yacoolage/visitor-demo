const STAGES = ["预约", "预检", "签到", "在场", "签退", "沉淀"];

const initialVisitors = [
  {
    id: "V-202601-001",
    name: "王伟",
    company: "星辰科技",
    host: "李娜",
    purpose: "客户需求评审",
    visitorType: "客户",
    time: "09:30",
    stageIndex: 1,
    approved: false,
    expectedLeave: "11:30",
    extensionMinutes: 0,
    status: "pending",
  },
  {
    id: "V-202601-002",
    name: "陈琳",
    company: "远航咨询",
    host: "赵晨",
    purpose: "项目复盘",
    visitorType: "合作方",
    time: "10:00",
    stageIndex: 2,
    approved: true,
    expectedLeave: "12:00",
    extensionMinutes: 0,
    status: "approved",
  },
  {
    id: "V-202601-003",
    name: "刘畅",
    company: "求职者",
    host: "HR-王敏",
    purpose: "面试",
    visitorType: "面试",
    time: "10:30",
    stageIndex: 3,
    approved: true,
    expectedLeave: "11:30",
    extensionMinutes: 0,
    status: "invisit",
  },
  {
    id: "V-202601-004",
    name: "张鹏",
    company: "速达快递",
    host: "行政前台",
    purpose: "快递交付",
    visitorType: "配送",
    time: "09:10",
    stageIndex: 4,
    approved: true,
    expectedLeave: "09:20",
    extensionMinutes: 0,
    status: "checkedout",
  },
];

const state = {
  visitors: structuredClone(initialVisitors),
  selectedId: initialVisitors[0].id,
  logs: [
    "系统初始化完成，已加载 4 条 mock 访客记录。",
    "王伟已完成预检，等待审批。",
  ],
};

const el = {
  visitorList: document.getElementById("visitorList"),
  pipeline: document.getElementById("pipeline"),
  eventLog: document.getElementById("eventLog"),
  metrics: document.getElementById("metrics"),
  detail: document.getElementById("visitorDetail"),
  hint: document.getElementById("actionHint"),
  approveBtn: document.getElementById("approveBtn"),
  checkInBtn: document.getElementById("checkInBtn"),
  enterZoneBtn: document.getElementById("enterZoneBtn"),
  delayBtn: document.getElementById("delayBtn"),
  checkOutBtn: document.getElementById("checkOutBtn"),
  markExceptionBtn: document.getElementById("markExceptionBtn"),
  resetBtn: document.getElementById("resetBtn"),
};

function getSelectedVisitor() {
  return state.visitors.find((v) => v.id === state.selectedId);
}

function pushLog(msg) {
  const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  state.logs.unshift(`${now}｜${msg}`);
  state.logs = state.logs.slice(0, 30);
}

function statusBadge(visitor) {
  if (visitor.status === "exception") return ["异常", "exception"];
  if (visitor.stageIndex >= 4) return ["已签退", "checkedout"];
  if (visitor.stageIndex >= 3) return ["在场中", "invisit"];
  if (visitor.approved) return ["已审批", "approved"];
  return ["待审批", "pending"];
}

function renderVisitorList() {
  el.visitorList.innerHTML = "";
  for (const visitor of state.visitors) {
    const [txt, cls] = statusBadge(visitor);
    const item = document.createElement("div");
    item.className = `visitor-item ${visitor.id === state.selectedId ? "active" : ""}`;
    item.innerHTML = `
      <div><strong>${visitor.name}</strong> · ${visitor.visitorType}</div>
      <div>${visitor.company}</div>
      <div>被访人：${visitor.host}</div>
      <div>预约时间：${visitor.time}</div>
      <span class="badge ${cls}">${txt}</span>
    `;
    item.onclick = () => {
      state.selectedId = visitor.id;
      render();
    };
    el.visitorList.appendChild(item);
  }
}

function renderPipeline() {
  const visitor = getSelectedVisitor();
  el.pipeline.innerHTML = "";
  STAGES.forEach((stage, idx) => {
    const step = document.createElement("div");
    let cls = "step";
    if (idx < visitor.stageIndex) cls += " done";
    if (idx === visitor.stageIndex) cls += " current";
    if (visitor.status === "exception") cls = "step";
    step.className = cls;
    step.textContent = stage;
    el.pipeline.appendChild(step);
  });
}

function renderMetrics() {
  const total = state.visitors.length;
  const checkedIn = state.visitors.filter((v) => v.stageIndex >= 2 && v.stageIndex < 4).length;
  const checkedOut = state.visitors.filter((v) => v.stageIndex >= 4).length;
  const exceptions = state.visitors.filter((v) => v.status === "exception").length;
  const approvalRate = Math.round((state.visitors.filter((v) => v.approved).length / total) * 100);
  const conversion = Math.round((state.visitors.filter((v) => v.stageIndex >= 2).length / total) * 100);

  const cards = [
    ["今日预约", total],
    ["当前在场", checkedIn],
    ["已签退", checkedOut],
    ["异常数", exceptions],
    ["审批通过率", `${approvalRate}%`],
    ["预约转签到率", `${conversion}%`],
  ];

  el.metrics.innerHTML = cards
    .map(
      ([label, value]) => `
      <div class="metric-card">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
      </div>
    `,
    )
    .join("");
}

function renderDetail() {
  const v = getSelectedVisitor();
  el.detail.className = "detail";
  el.detail.innerHTML = `
    <div><strong>${v.name}</strong>（${v.id}）</div>
    <div>公司：${v.company}</div>
    <div>访客类型：${v.visitorType}</div>
    <div>被访人：${v.host}</div>
    <div>来访事由：${v.purpose}</div>
    <div>预计离场：${v.expectedLeave}</div>
    <div>已延时：${v.extensionMinutes} 分钟</div>
    <div>当前节点：${STAGES[v.stageIndex]}</div>
  `;
}

function renderLogs() {
  el.eventLog.innerHTML = state.logs.map((x) => `<li>${x}</li>`).join("");
}

function refreshActionState() {
  const v = getSelectedVisitor();
  const isException = v.status === "exception";
  el.approveBtn.disabled = v.approved || isException;
  el.checkInBtn.disabled = !v.approved || v.stageIndex > 2 || isException;
  el.enterZoneBtn.disabled = v.stageIndex !== 2 || isException;
  el.delayBtn.disabled = v.stageIndex !== 3 || isException;
  el.checkOutBtn.disabled = v.stageIndex < 3 || v.stageIndex > 4 || isException;
  el.markExceptionBtn.disabled = isException || v.stageIndex >= 4;
  el.hint.textContent = `${v.name} 当前处于「${STAGES[v.stageIndex]}」阶段。`;
}

function render() {
  renderVisitorList();
  renderPipeline();
  renderMetrics();
  renderDetail();
  renderLogs();
  refreshActionState();
}

el.approveBtn.onclick = () => {
  const v = getSelectedVisitor();
  v.approved = true;
  if (v.stageIndex < 2) v.stageIndex = 2;
  v.status = "approved";
  pushLog(`${v.name} 审批通过，已可进行现场签到。`);
  render();
};

el.checkInBtn.onclick = () => {
  const v = getSelectedVisitor();
  if (v.stageIndex < 2) v.stageIndex = 2;
  v.status = "approved";
  pushLog(`${v.name} 完成签到，已生成电子访客证。`);
  render();
};

el.enterZoneBtn.onclick = () => {
  const v = getSelectedVisitor();
  v.stageIndex = 3;
  v.status = "invisit";
  pushLog(`${v.name} 进入在场状态，已下发门禁权限。`);
  render();
};

el.delayBtn.onclick = () => {
  const v = getSelectedVisitor();
  v.extensionMinutes += 30;
  pushLog(`${v.name} 延时申请通过，额外延长 30 分钟。`);
  render();
};

el.checkOutBtn.onclick = () => {
  const v = getSelectedVisitor();
  v.stageIndex = 4;
  v.status = "checkedout";
  pushLog(`${v.name} 已签退，门禁权限已回收。`);
  render();
};

el.markExceptionBtn.onclick = () => {
  const v = getSelectedVisitor();
  v.status = "exception";
  pushLog(`${v.name} 被标记异常，已转人工核验流程。`);
  render();
};

el.resetBtn.onclick = () => {
  state.visitors = structuredClone(initialVisitors);
  state.selectedId = state.visitors[0].id;
  state.logs = ["系统已重置为初始 mock 数据。"];
  render();
};

render();
