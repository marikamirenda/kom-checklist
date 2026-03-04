const STORAGE_KEY = "kom_checklist_state_v1";

let checklistData = null;
let state = loadState(); // { [id]: true/false }

init();

function init() {
  fetch("checklist.json")
    .then(r => r.json())
    .then(data => {
      checklistData = data;
      renderChecklist(data);
      wireTopButtons();
    })
    .catch(err => console.error("Failed to load checklist.json", err));
}

function wireTopButtons() {
  document.getElementById("btnRequestMissing").addEventListener("click", () => {
    const missing = getMissingItems();
    if (missing.length === 0) {
      console.log("No missing items.");
      return;
    }

    dispatchRequest({
      type: "bulk_missing",
      subject: `[KOM] Missing materials (${missing.length})`,
      message: buildBulkMessage(missing),
      items: missing.map(x => x.id)
    });
  });

  document.getElementById("btnExportState").addEventListener("click", () => {
    const exportObj = {
      exportedAt: new Date().toISOString(),
      meta: checklistData?.meta || {},
      state
    };
    downloadJson(exportObj, "kom-checklist-state.json");
  });

  document.getElementById("btnClear").addEventListener("click", () => {
    state = {};
    saveState(state);
    rerender();
  });
}

function renderChecklist(data) {
  const container = document.getElementById("checklist");
  container.innerHTML = "";

  data.sections.forEach(section => {
    const sectionDiv = document.createElement("section");
    sectionDiv.className = "section";

    const title = document.createElement("h2");
    title.innerText = section.title;
    sectionDiv.appendChild(title);

    section.items.forEach(item => {
      const row = document.createElement("div");
      row.className = "item-row";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = item.id;
      checkbox.checked = !!state[item.id];

      const label = document.createElement("label");
      label.htmlFor = item.id;
      label.innerText = item.text;

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.innerText = `id: ${item.id}`;

      label.appendChild(badge);

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const requestBtn = document.createElement("button");
      requestBtn.type = "button";
      requestBtn.innerText = "Richiedi";
      requestBtn.disabled = checkbox.checked;

      checkbox.addEventListener("change", () => {
        state[item.id] = checkbox.checked;
        saveState(state);
        requestBtn.disabled = checkbox.checked;
      });

      requestBtn.addEventListener("click", () => {
        const payload = buildSingleRequestPayload(item);
        dispatchRequest(payload);
      });

      actions.appendChild(requestBtn);

      row.appendChild(checkbox);
      row.appendChild(label);
      row.appendChild(actions);

      sectionDiv.appendChild(row);
    });

    container.appendChild(sectionDiv);
  });
}

function rerender() {
  if (!checklistData) return;
  renderChecklist(checklistData);
}

function getMissingItems() {
  const missing = [];
  checklistData.sections.forEach(sec => {
    sec.items.forEach(item => {
      if (!state[item.id]) {
        missing.push({
          id: item.id,
          text: item.text,
          request: item.request || null
        });
      }
    });
  });
  return missing;
}

function buildSingleRequestPayload(item) {
  const fallbackSubject = `[KOM] Missing: ${item.text}`;
  const fallbackMessage = `Please provide or confirm availability of: "${item.text}".`;

  const subject = item.request?.subject || fallbackSubject;
  const message = item.request?.message || fallbackMessage;

  return {
    type: "single_missing",
    itemId: item.id,
    subject,
    message
  };
}

function buildBulkMessage(missingItems) {
  const lines = missingItems.map((x, i) => {
    return `${i + 1}. ${x.text} (id: ${x.id})`;
  });

  return [
    "The following KOM materials are still missing:",
    "",
    ...lines,
    "",
    "Please share the materials or confirm expected delivery dates."
  ].join("\n");
}

function dispatchRequest(payload) {
  // MOCK: oggi fa solo log. Qui poi collegherai Power Automate (Teams/Outlook).
  console.log("REQUEST_DISPATCH", payload);

  // Esempio futuro:
  // fetch("<POWER_AUTOMATE_HTTP_TRIGGER_URL>", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload)
  // }).then(r => r.json()).then(console.log).catch(console.error);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
