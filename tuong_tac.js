/* filepath: d:\NAM.lt\html.beta\scripts.js */
// Quản lý giáo viên
let db;
const tableBody = document.getElementById("tableBody");
const teacherNameInput = document.getElementById("teacherName");
const subjectNameInput = document.getElementById("subjectName");
const fileInput = document.getElementById("fileInput");

const request = indexedDB.open("TeachersDB", 1);
request.onerror = e => console.error("Lỗi IndexedDB", e);
request.onsuccess = e => { db = e.target.result; renderTeachers(); };
request.onupgradeneeded = e => {
  db = e.target.result;
  const store = db.createObjectStore("teachers", { keyPath: ["teacher", "subject"] });
  store.createIndex("teacher", "teacher", { unique: false });
  store.createIndex("subject", "subject", { unique: false });
};

function addTeacher() {
  const teacherName = teacherNameInput.value.trim() || "Tên giáo viên";
  const subjectName = subjectNameInput.value.trim() || "Môn học";
  const files = Array.from(fileInput.files);
  if (files.length === 0) { alert("Vui lòng chọn ít nhất 1 file!"); return; }

  const transaction = db.transaction(["teachers"], "readwrite");
  const store = transaction.objectStore("teachers");

  const getReq = store.get([teacherName, subjectName]);
  getReq.onsuccess = () => {
    const existing = getReq.result || { teacher: teacherName, subject: subjectName, files: [] };
    files.forEach(file => existing.files.push(file));
    store.put(existing);
    transaction.oncomplete = () => {
      renderTeachers();
      teacherNameInput.value = "";
      subjectNameInput.value = "";
      fileInput.value = "";
    };
  };
}

function renderTeachers() {
  tableBody.innerHTML = "";
  const transaction = db.transaction(["teachers"], "readonly");
  const store = transaction.objectStore("teachers");
  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const item = cursor.value;
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = item.teacher;

      const subjectCell = document.createElement("td");
      subjectCell.textContent = item.subject;

      const fileCell = document.createElement("td");
      item.files.forEach(file => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.textContent = file.name;
        link.target = "_blank";
        fileCell.appendChild(link);
        fileCell.appendChild(document.createElement("br"));
      });

      const actionCell = document.createElement("td");
      const delTeacherBtn = document.createElement("span");
      delTeacherBtn.textContent = "Xóa";
      delTeacherBtn.style.color = "red";
      delTeacherBtn.style.cursor = "pointer";
      delTeacherBtn.onclick = () => deleteTeacher(item.teacher, item.subject);
      actionCell.appendChild(delTeacherBtn);

      row.appendChild(nameCell);
      row.appendChild(subjectCell);
      row.appendChild(fileCell);
      row.appendChild(actionCell);
      tableBody.appendChild(row);

      cursor.continue();
    }
  };
}

function deleteTeacher(teacher, subject) {
  const transaction = db.transaction(["teachers"], "readwrite");
  const store = transaction.objectStore("teachers");
  store.delete([teacher, subject]);
  transaction.oncomplete = renderTeachers;
}