/* script.js — Aboyounis Final v4 (معدل) */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyoXPSrp27UuQaQyLsOBLoCANqWIi9WG0dJi7QCyU32ilJ2Nsx0IKXckNupsqTY5gjaeQ/exec";

// بيانات الدخول
const ADMIN_USER = "1";
const ADMIN_PASS = "1";

// ---------------- تسجيل الدخول ----------------
function login(event) {
  event.preventDefault();

  const name = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!name || !pass) {
    showPopup("⚠️ من فضلك أدخل الاسم وكلمة المرور", "error");
    return;
  }

  // ✅ تحقق من اسم المستخدم وكلمة المرور
  if (name === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem("ppa_logged_in", "1");
    localStorage.setItem("ppa_user", name);

    const loginWrap = document.getElementById("loginFormWrap");
    const welcome = document.getElementById("welcome");
    const welcomeText = document.getElementById("welcomeText");

    if (loginWrap && welcome && welcomeText) {
      loginWrap.style.display = "none";
      welcomeText.textContent = `أهلاً ${name} 👋`;
      welcome.style.display = "block";
    }
  } else {
    showPopup("❌ اسم المستخدم أو كلمة المرور غير صحيحة", "error");
  }
}

function checkLogin() {
  if (localStorage.getItem("ppa_logged_in") !== "1") {
    if (!location.pathname.endsWith("index.html") && !location.pathname.endsWith("/")) {
      location.href = "index.html";
    }
  }
}

function logout() {
  localStorage.clear();
  location.href = "index.html";
}

// ---------------- إضافة بيانات ----------------
let addingInProgress = false;
async function handleAdd(e) {
  e.preventDefault();
  if (addingInProgress) return;
  addingInProgress = true;

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const age = document.getElementById("age").value.trim();
  const job = document.getElementById("job").value.trim();
  const city = document.getElementById("city").value.trim();
  const notes = document.getElementById("notes").value.trim();

  if (!name || !phone) {
    showPopup("⚠️ الاسم ورقم الهاتف مطلوبان", "error");
    addingInProgress = false;
    return;
  }

  try {
    const payload = { action: "add", name, phone, age, job, city, notes };

    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    showPopup("✅ تمت الإضافة بنجاح", "success");
    document.getElementById("addForm").reset();

    setTimeout(() => {
      location.href = "dashboard.html";
    }, 1200);
  } catch (err) {
    console.error(err);
    showPopup("❌ حدث خطأ أثناء الإضافة", "error");
  }

  addingInProgress = false;
}

// ---------------- لوحة التحكم ----------------
async function initDashboard() {
  checkLogin();
  await loadRows();
}

async function loadRows() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=list`);
    const obj = await res.json();

    if (!obj.success) {
      showPopup("⚠️ فشل في جلب البيانات", "error");
      return;
    }

    renderTable(obj.rows || []);
  } catch (err) {
    console.error(err);
    showPopup("⚠️ خطأ في جلب البيانات — تأكد من نشر Web App (Anyone)", "error");
  }
}

function renderTable(rows) {
  const tbody = document.getElementById("peopleTbody");
  tbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="hint">لا توجد بيانات بعد</td></tr>`;
    return;
  }

  // ✅ بدء الحلقة من الصف 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const cols = r.cols;
    while (cols.length < 7) cols.push("");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rowIndex}</td>
      <td>${escapeHtml(cols[0])}</td>
      <td>${escapeHtml(cols[1])}</td>
      <td>${escapeHtml(cols[2])}</td>
      <td>${escapeHtml(cols[3])}</td>
      <td>${escapeHtml(cols[4])}</td>
      <td>${escapeHtml(cols[5])}</td>
      <td>${escapeHtml(cols[6])}</td>
      <td class="actions-btns">
        <button class="btn small" onclick="openEditModal(${r.rowIndex})">✏️ تعديل</button>
        <button class="btn small secondary" onclick="confirmDelete(${r.rowIndex})">🗑️ حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// ---------------- تعديل البيانات ----------------
function openEditModal(rowIndex) {
  fetch(`${SCRIPT_URL}?action=list`)
    .then((r) => r.json())
    .then((obj) => {
      if (!obj.success) return showPopup("❌ فشل جلب البيانات للمودال", "error");
      const item = obj.rows.find((x) => x.rowIndex === rowIndex);
      if (!item) return showPopup("⚠️ العنصر غير موجود", "error");

      const cols = item.cols;
      document.getElementById("editRowIndex").value = rowIndex;
      document.getElementById("editName").value = cols[1] || "";
      document.getElementById("editPhone").value = cols[2] || "";
      document.getElementById("editAge").value = cols[3] || "";
      document.getElementById("editJob").value = cols[4] || "";
      document.getElementById("editCity").value = cols[5] || "";
      document.getElementById("editNotes").value = cols[6] || "";

      document.getElementById("modal").setAttribute("aria-hidden", "false");
    })
    .catch(() => showPopup("❌ خطأ في تحميل البيانات", "error"));
}

function closeModal() {
  document.getElementById("modal").setAttribute("aria-hidden", "true");
}

async function submitEdit(e) {
  e.preventDefault();

  const rowIndex = document.getElementById("editRowIndex").value;
  const name = document.getElementById("editName").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const age = document.getElementById("editAge").value.trim();
  const job = document.getElementById("editJob").value.trim();
  const city = document.getElementById("editCity").value.trim();
  const notes = document.getElementById("editNotes").value.trim();

  if (!name || !phone) {
    showPopup("⚠️ الاسم ورقم الهاتف مطلوبان", "error");
    return;
  }

  try {
    const payload = { action: "update", rowIndex, name, phone, age, job, city, notes };
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    showPopup("✅ تم حفظ التعديلات", "success");
    closeModal();
    setTimeout(loadRows, 1000);
  } catch (err) {
    console.error(err);
    showPopup("❌ فشل حفظ التعديل", "error");
  }
}

// ---------------- حذف البيانات ----------------
function confirmDelete(rowIndex) {
  showPopup(
    `<p>هل أنت متأكد من الحذف؟</p>
     <button class='btn small' onclick='doDelete(${rowIndex})'>نعم</button>
     <button class='btn small secondary' onclick='hidePopup()'>إلغاء</button>`,
    "confirm"
  );
}

async function doDelete(rowIndex) {
  try {
    const payload = { action: "delete", rowIndex };
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    showPopup("🗑️ تم الحذف بنجاح", "success");
    setTimeout(loadRows, 800);
  } catch (err) {
    console.error(err);
    showPopup("❌ خطأ أثناء الحذف", "error");
  }
}

// ---------------- أدوات مساعدة ----------------
function escapeHtml(str) {
  if (!str) return "";
  str = String(str);
  return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function showPopup(msg, type) {
  const popup = document.getElementById("popup");
  popup.className = `popup ${type}`;
  popup.innerHTML = msg;
  popup.style.display = "block";
  if (type !== "confirm") {
    setTimeout(() => (popup.style.display = "none"), 2500);
  }
}

function hidePopup() {
  document.getElementById("popup").style.display = "none";
}

// ---------------- وظائف إضافية ----------------
function goAdd() {
  location.href = "add.html";
}

// ---------------- تهيئة الصفحات ----------------
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", login);

  const addForm = document.getElementById("addForm");
  if (addForm) addForm.addEventListener("submit", handleAdd);

  const editForm = document.getElementById("editForm");
  if (editForm) editForm.addEventListener("submit", submitEdit);

  if (location.pathname.endsWith("dashboard.html")) initDashboard();
});
