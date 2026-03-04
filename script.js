/* ===================== KOM CHECKLIST — script.js (FULL) ===================== */

const STORAGE_KEY = "kom_checklist_state_v1";
const REQUEST_EMAILS_KEY = "kom_request_emails_v1"; // ultime email usate (mock)

let checklistData = null;
let state = loadState(); // { [id]: true/false }

let modal = null;
let modalContext = null; // { itemId, itemText, subject, message }

init();

function init() {
  fetch("checklist.json")
    .then((r) => r.json())
    .then((data) => {
      checklistData = data;
      renderChecklist(data);
      wireTopButtons();
      initModal(); // modal per Richiedi (email + messaggio) — mock
    })
    .catch((err) => console.error("Failed to load checklist.json", err));
}

/* ===================== TOP BUTTONS ===================== */

function wireTopButtons() {
  const btnRequestMissing = document.getElementById("btnRequestMissing");
  const btnExportState = document.getElementById("btnExportState");
  const btnClear = document.getElementById("btnClear");

  if (btnRequestMissing) {
    btnRequestMissing.addEventListener("click", () => {
      const missing = getMissingItems();
      if (missing.length === 0) {
        console.log("No missing items.");
        return;
      }

      dispatchRequest({
        type: "bulk_missing",
        subject: `[KOM] Missing materials (${missing.length})`,
        message: buildBulkMessage(missing),
        items: missing.map((x) => x.id),
      });
    });
  }

  if (btnExportState) {
    btnExportState.addEventListener("click", () => {
      const exportObj = {
        exportedAt: new Date().toISOString(),
        meta: checklistData?.meta || {},
        state,
      };
      downloadJson(exportObj, "kom-checklist-state.json");
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      state = {};
      saveState(state);
      rerender();
    });
  }
}

/* ===================== RENDER ===================== */

function renderChecklist(data) {
  const container = document.getElementById("checklist");
  if (!container) {
    console.error('Missing container element with id="checklist" in index.html');
    return;
  }

  container.innerHTML = "";

  data.sections.forEach((section) => {
    const sectionDiv = document.createElement("section");
    sectionDiv.className = "section";

    const title = document.createElement("h2");
    title.innerText = section.title;
    sectionDiv.appendChild(title);

    section.items.forEach((item) => {
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

      // IMPORTANT: Richiedi apre il modal (mock email)
      requestBtn.addEventListener("click", () => {
        openRequestModal(item);
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

/* ===================== MISSING ITEMS / PAYLOAD ===================== */

function getMissingItems() {
  const missing = [];
  checklistData.sections.forEach((sec) => {
    sec.items.forEach((item) => {
      if (!state[item.id]) {
        missing.push({
          id: item.id,
          text: item.text,
          request: item.request || null,
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
    message,
  };
}

function buildBulkMessage(missingItems) {
  const lines = missingItems.map((x, i) => `${i + 1}. ${x.text} (id: ${x.id})`);

  return [
    "The following KOM materials are still missing:",
    "",
    ...lines,
    "",
    "Please share the materials or confirm expected delivery dates.",
  ].join("\n");
}

/* ===================== DISPATCH (MOCK) ===================== */

function dispatchRequest(payload) {
  // MOCK ONLY: nessuna integrazione reale
  console.log("REQUEST_DISPATCH", payload);

  // FUTURO (Power Automate):
  // fetch("<POWER_AUTOMATE_HTTP_TRIGGER_URL>", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // })
  //   .then((r) => r.json())
  //   .then(console.log)
  //   .catch(console.error);
}

/* ===================== STATE STORAGE ===================== */

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

/* ===================== EXPORT ===================== */

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

/* ===================== MODAL (EMAIL + MESSAGE) — MOCK ===================== */

function initModal() {
  modal = document.getElementById("requestModal");
  if (!modal) {
    console.warn('Modal not found in DOM: id="requestModal". Inserisci il blocco modal in index.html.');
    return;
  }

  const btnClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("modalCancel");
  const btnSend = document.getElementById("modalSend");

  if (!btnClose || !btnCancel || !btnSend) {
    console.error("Modal buttons not found. Required IDs: modalClose, modalCancel, modalSend");
    return;
  }

  btnClose.addEventListener("click", closeModal);
  btnCancel.addEventListener("click", closeModal);

  // Click fuori dalla card = chiudi
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Invio (mock)
  btnSend.addEventListener("click", () => {
    const emailInput = document.getElementById("modalEmail");
    const error = document.getElementById("modalEmailError");
    const messageBox = document.getElementById("modalMessage");

    if (!emailInput || !error || !messageBox) {
      console.error("Modal fields not found. Required IDs: modalEmail, modalEmailError, modalMessage");
      return;
    }

    const email = (emailInput.value || "").trim();
    if (!isValidEmail(email)) {
      error.classList.remove("hidden");
      return;
    }
    error.classList.add("hidden");

    const payload = {
      type: "single_missing_email_mock",
      itemId: modalContext?.itemId || "",
      to: email,
      subject: modalContext?.subject || "[KOM] Missing",
      message: messageBox.value,
    };

    rememberEmail(email);
    dispatchRequest(payload);
    closeModal();
  });

  // ESC per chiudere
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });
}

function openRequestModal(item) {
  // Fallback: se modal non c’è, logga comunque la richiesta standard
  if (!modal) {
    console.warn("Modal non inizializzato. Fallback: request standard in console (senza email).");
    const payload = buildSingleRequestPayload(item);
    dispatchRequest(payload);
    return;
  }

  const payload = buildSingleRequestPayload(item);

  modalContext = {
    itemId: payload.itemId,
    itemText: item.text,
    subject: payload.subject,
    message: payload.message,
  };

  const itemTextEl = document.getElementById("modalItemText");
  const msgEl = document.getElementById("modalMessage");
  const emailEl = document.getElementById("modalEmail");
  const errEl = document.getElementById("modalEmailError");

  if (!itemTextEl || !msgEl || !emailEl || !errEl) {
    console.error("Modal elements missing. Check IDs: modalItemText, modalMessage, modalEmail, modalEmailError");
    return;
  }

  itemTextEl.innerText = `${item.text} (id: ${item.id})`;
  msgEl.value = payload.message;

  const last = getLastRememberedEmail();
  emailEl.value = last || "";
  errEl.classList.add("hidden");

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  setTimeout(() => emailEl.focus(), 0);
}

function closeModal() {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modalContext = null;
}

function isValidEmail(email) {
  // validazione semplice (mock)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function rememberEmail(email) {
  try {
    const raw = localStorage.getItem(REQUEST_EMAILS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const next = [email, ...arr.filter((x) => x !== email)].slice(0, 5);
    localStorage.setItem(REQUEST_EMAILS_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("Failed to remember email", e);
  }
}

function getLastRememberedEmail() {
  try {
    const raw = localStorage.getItem(REQUEST_EMAILS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return arr[0] || "";
  } catch {
    return "";
  }
}
