
function calcAttendancePercent(m){ const p=Number(m.present)||0, t=Number(m.total)||0; return t? +((p/t)*100).toFixed(2) : 0; }
function avgAttendanceFor(student){
  const months = Object.values(student.attendance || {})
    .filter(m => Number(m.total) > 0);   // ignore empty months

  if(!months.length) return 0;

  const vals = months.map(m => calcAttendancePercent(m));
  return +( (vals.reduce((a,b)=>a+b,0) / vals.length).toFixed(2) );
}

// test percentage: (score / fullMarks)*100, clamp at 0 if fullMarks missing
function percentOfTest(test){
  const fm = Number(test.fullMarks) || 0;
  const sc = Number(test.score) || 0;

  if(!fm) return 0;

  return +((sc / fm) * 100).toFixed(2);
}
function avgTestPercentFor(student){
  const tests = [
    ...Object.values(student.classTests || {}),
    ...Object.values(student.mockTests || {})
  ];

  let totalMarks = 0;
  let totalFullMarks = 0;

  tests.forEach(t => {

    // ❌ skip absent
    if(t.score === "AB") return;

    const score = Number(t.score) || 0;
    const full = Number(t.fullMarks) || 0;

    // ❌ skip invalid full marks
    if(full === 0) return;

    totalMarks += score;
    totalFullMarks += full;
  });

  // ❌ no valid test
  if(totalFullMarks === 0) return 0;

  return +((totalMarks / totalFullMarks) * 100).toFixed(2);
}

function finalColorClass(val){ if(val<40) return 'score-red'; if(val<70) return 'score-orange'; return 'score-green'; }
function attColorClass(pct){ if(pct<75) return 'att-red'; if(pct<90) return 'att-orange'; return 'att-green'; }
function escapeHtml(s){ if(s===undefined||s===null) return ''; return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- Render Students ---------- */
const studentsList = document.getElementById('studentsList');

const searchBox = document.getElementById('searchBox') || { value: "" };
const filterCategory = document.getElementById('filterCategory') || { value: "" };
const filterGender = document.getElementById('filterGender') || { value: "" };
const filterCourse = document.getElementById('filterCourse') || { value: "" };
const sortBy = document.getElementById('sortBy') || { value: "" };
const toggleDashboardBtn=document.getElementById('toggleDashboard');
const dashboardArea=document.getElementById('dashboardArea');
let attendanceChart=null, scoreChart=null;
let currentPage = 1;
const studentsPerPage = 20;

function renderStudents() {
  const studentsList = document.getElementById("studentsList");

  const q = (searchBox.value || '').toLowerCase();
 const cat = filterCategory?.value || "";
const gender = filterGender?.value || "";

let list = (window.students || []).filter(s => {

  const matchQ = (s.name || '').toLowerCase().includes(q) || String(s.roll).includes(q);

  const matchCategory = !cat || s.category === cat;

  const matchGender = !gender || s.gender === gender;

  const matchCourse = !filterCourse.value || s.course === filterCourse.value;

  return matchQ && matchCategory && matchGender && matchCourse;

});

const sort = sortBy.value;

if (sort === "roll") {
  list.sort((a,b) => a.roll - b.roll);
}

if (sort === "name") {
  list.sort((a,b) => a.name.localeCompare(b.name));
}

if (sort === "attendance") {
  list.sort((a,b) => avgAttendanceFor(b) - avgAttendanceFor(a));
}

if (sort === "score") {
  list.sort((a,b) => avgTestPercentFor(b) - avgTestPercentFor(a));
}
const studentCount = document.getElementById("studentCount");

if(studentCount){
  studentCount.innerHTML = `Showing <b>${list.length}</b> students`;
}

studentsList.innerHTML = '';

const start = (currentPage - 1) * studentsPerPage;
const end = start + studentsPerPage;

const paginatedStudents = list.slice(start, end);

paginatedStudents.forEach((s, idx) =>
  studentsList.appendChild(studentCardDom(s, start + idx))
);

renderPagination(list.length);

if (typeof Chart !== "undefined") {
  renderDashboard();
}
}

/* ---------- Student Card ---------- */
function studentCardDom(student, idx){
  const wrapper = document.createElement('div');
  wrapper.className = 'card p-3 student-card';
  wrapper.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center">
      <div><strong>${escapeHtml(student.name)}</strong> <small class="help-muted">(Roll: ${student.roll})</small></div>
      <div><span class="chip">${escapeHtml(student.category||'')}</span></div>
    </div>
  `;
  const body = document.createElement('div'); body.className='card-body'; wrapper.appendChild(body);

  // row: photo + tabs + mini chart in summary area
  const row = document.createElement('div'); row.className='row g-3';
  const colPhoto = document.createElement('div'); colPhoto.className='col-md-3 text-center';
  colPhoto.innerHTML = `
   <img 
  src="${student.photoId ? `/api/upload/${student.photoId}` : 'https://via.placeholder.com/110'}"
  class="profile-pic mb-2"
  id="photo-${idx}"
>
    <div class="mb-2"><input type="file" id="photoInput-${idx}" class="form-control form-control-sm" accept="image/*"></div>
    <div class="help-muted">Upload photo</div>
  `;
  row.appendChild(colPhoto);

  const colTabs = document.createElement('div'); colTabs.className='col-md-9';
  const tabsId = `tabs-${idx}`;
  colTabs.innerHTML = `
    <ul class="nav nav-tabs" id="${tabsId}" role="tablist">
      <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#view-${idx}">View</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#att-${idx}">Attendance</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tests-${idx}">Tests</button></li>
      <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#summary-${idx}">Summary</button></li>
    </ul>

    <div class="tab-content pt-3">
      <div class="tab-pane fade show active" id="view-${idx}">${renderProfileViewHtml(student)}</div>
      <div class="tab-pane fade" id="att-${idx}">
        <div id="attList-${idx}">${renderAttendanceHtml(student.attendance)}</div>
      </div>
<div class="tab-pane fade" id="tests-${idx}">

<ul class="nav nav-pills mb-2">
  <li class="nav-item">
    <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#classtest-${idx}">
      Class Tests
    </button>
  </li>
  <li class="nav-item">
    <button class="nav-link" data-bs-toggle="pill" data-bs-target="#mocktest-${idx}">
      Mock Exams
    </button>
  </li>
</ul>

<div class="tab-content">

<div class="tab-pane fade show active" id="classtest-${idx}">
<div id="classTestsList-${idx}">
${renderTestsHtml(student.classTests)}
</div>
</div>

<div class="tab-pane fade" id="mocktest-${idx}">
<div id="mockTestsList-${idx}">
${renderTestsHtml(student.mockTests)}
</div>
</div>

</div>
        
</div>
      <div class="tab-pane fade" id="summary-${idx}">
        <div class="row">
          <div class="col-md-6"><label class="label-sm">Remarks</label><textarea id="remarks-${idx}" class="form-control" rows="3">${escapeHtml(student.remarks||'')}</textarea></div>
          <div class="col-md-6 text-center">
            <div class="label-sm mb-2">Mini Chart (Attendance % vs Test %)</div>
            <canvas id="miniChart-${idx}" class="mini-chart"></canvas>
            <div class="mt-2">
              <span class="badge bg-light text-dark badge-small">Att: <strong id="miniAtt-${idx}">${avgAttendanceFor(student)}%</strong></span>
              <span class="badge bg-light text-dark badge-small">Test %: <strong id="miniTest-${idx}">${avgTestPercentFor(student)}%</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  row.appendChild(colTabs);
  body.appendChild(row);

  // attach listeners after DOM appended
  setTimeout(()=>{
    // photo upload
const photoInput = document.getElementById(`photoInput-${idx}`);

if (photoInput) {
  photoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
formData.append("studentId", student._id);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      student.photoId = data.fileId;
      renderStudents();

    } catch (err) {
      console.error(err);
      alert("Photo upload failed");
    }
  });
}


    // Remarks autosave
const remarksEl = document.getElementById(`remarks-${idx}`);

let remarkTimer;

if(remarksEl){
  remarksEl.addEventListener('input', (e) => {

    clearTimeout(remarkTimer);

    remarkTimer = setTimeout(async () => {

      try {
        await fetch(`/api/students/${student._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ remarks: e.target.value })
        });

        console.log("Remarks auto-saved ✅");

      } catch (err) {
        console.error("Auto-save failed ❌", err);
      }

    }, 800);

  });
}

 
          // update mini summary numbers (not persisted until Save, but reflect immediately)
          const miniAttEl = document.getElementById(`miniAtt-${idx}`);
          if(miniAttEl) miniAttEl.textContent = avgAttendanceFor(student) + '%';
          // refresh mini chart
          drawMiniChart(idx, student);


    // draw mini chart
    drawMiniChart(idx, student);

  }, 10);

  return wrapper;
}

/* ---------- HTML snippets for sections ---------- */
function renderProfileViewHtml(s){
  return `
    <div class="row g-2">
      <div class="col-md-6"><div class="label-sm">Student Name</div><div>${escapeHtml(s.name)}</div></div>
      <div class="col-md-6"><div class="label-sm">Mobile</div><div>${escapeHtml(s.studentMobile||'')}</div></div>
      <div class="col-md-6"><div class="label-sm">Father's Name</div><div>${escapeHtml(s.father||'')}</div></div>
      <div class="col-md-6"><div class="label-sm">Father's Mobile</div><div>${escapeHtml(s.fatherMobile||'')}</div></div>
      <div class="col-md-6"><div class="label-sm">Email</div><div>${escapeHtml(s.email||'')}</div></div>
      <div class="col-md-6"><div class="label-sm">DOB</div><div>${escapeHtml(s.dob||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Gender</div><div>${escapeHtml(s.gender||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Category</div><div>${escapeHtml(s.category||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Course</div><div>${escapeHtml(s.course||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Admission Date</div><div>${escapeHtml(s.admissionDate||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Aadhaar</div><div>${escapeHtml(s.aadhaar||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Rank</div><div>${escapeHtml(s.rank||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Blood Group</div><div>${escapeHtml(s.bloodGroup||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Area</div><div>${escapeHtml(s.area||'')}</div></div>
      <div class="col-md-4"><div class="label-sm">Avg Attendance</div><div>${avgAttendanceFor(s)}%</div></div>
      <div class="col-md-4"><div class="label-sm">Avg Test %</div><div>${avgTestPercentFor(s)}%</div></div>
    </div>
  `;
}

function renderProfileEditHtml(s, idx){
  return `
    <div class="row g-2">
      <div class="col-md-6"><label class="label-sm">Student Name</label><input id="edit_name_${idx}" class="form-control" value="${escapeHtml(s.name)}"></div>
      <div class="col-md-6"><label class="label-sm">Mobile</label><input id="edit_studentMobile_${idx}" class="form-control" value="${escapeHtml(s.studentMobile||'')}"></div>
      <div class="col-md-6"><label class="label-sm">Father's Name</label><input id="edit_father_${idx}" class="form-control" value="${escapeHtml(s.father||'')}"></div>
      <div class="col-md-6"><label class="label-sm">Father's Mobile</label><input id="edit_fatherMobile_${idx}" class="form-control" value="${escapeHtml(s.fatherMobile||'')}"></div>
      <div class="col-md-6"><label class="label-sm">Email</label><input id="edit_email_${idx}" class="form-control" value="${escapeHtml(s.email||'')}"></div>
      <div class="col-md-6"><label class="label-sm">DOB</label><input id="edit_dob_${idx}" class="form-control" value="${escapeHtml(s.dob||'')}"></div>
      <div class="col-md-4"><label class="label-sm">Gender</label>
        <select id="edit_gender_${idx}" class="form-select">
          <option ${s.gender==='MALE'?'selected':''}>MALE</option>
          <option ${s.gender==='FEMALE'?'selected':''}>FEMALE</option>
          <option ${s.gender==='OTHER'?'selected':''}>OTHER</option>
        </select>
      </div>
      <div class="col-md-4"><label class="label-sm">Category</label>
        <select id="edit_category_${idx}" class="form-select">
          <option ${s.category==='SC'?'selected':''}>SC</option>
          <option ${s.category==='ST'?'selected':''}>ST</option>
          <option ${s.category==='OBC'?'selected':''}>OBC</option>
          <option ${s.category==='General'?'selected':''}>General</option>
        </select>
      </div>
      <div class="col-md-4">
  <label class="label-sm">Course</label>
  <select id="edit_course_${idx}" class="form-select">
    <option ${s.course==='CGPSC'?'selected':''}>CGPSC</option>
    <option ${s.course==='VYAPAM'?'selected':''}>VYAPAM</option>
  </select>
</div>

      <div class="col-md-4"><label class="label-sm">Aadhaar</label><input id="edit_aadhaar_${idx}" class="form-control" value="${escapeHtml(s.aadhaar||'')}"></div>
      <div class="col-md-4"><label class="label-sm">Rank</label><input id="edit_rank_${idx}" class="form-control" value="${escapeHtml(s.rank||'')}"></div>
<div class="col-md-4">
  <label class="label-sm">Admission Date</label>
  <input id="edit_admission_${idx}" type="date" class="form-control"
         value="${s.admissionDate || new Date().toISOString().split('T')[0]}">
</div>
      <div class="col-md-4"><label class="label-sm">Blood Group</label><input id="edit_blood_${idx}" class="form-control" value="${escapeHtml(s.bloodGroup||'')}"></div>
      <div class="col-md-4"><label class="label-sm">Area</label><input id="edit_area_${idx}" class="form-control" value="${escapeHtml(s.area||'')}"></div>
      <div class="col-12 text-end mt-2 d-flex justify-content-between"><button id="deleteStudent-${idx}" class="btn btn-sm btn-danger">Delete Student</button><button id="saveProfile-${idx}" class="btn btn-sm btn-success">Save Profile</button></div>
    </div>
  `;
}

/* ---------- Attendance / Tests rendering ---------- */
function renderAttendanceHtml(attObj){
  attObj = attObj || {};

// 🔥 FIX: convert 2025-06 → June
let months = Object.keys(attObj).map(m => {
  if (m.includes("-")) {
    const mm = m.split("-")[1];

    const monthMap = {
      "01":"January","02":"February","03":"March","04":"April",
      "05":"May","06":"June","07":"July","08":"August",
      "09":"September","10":"October","11":"November","12":"December"
    };

    return monthMap[mm] || m;
  }
  return m;
});

// 🔥 remove duplicates
months = [...new Set(months)];

  if(!months.length){
    return '<div class="help-muted">No attendance data available</div>';
  }

  // sort months properly
  const monthOrder = [
    "July","August","September","October","November","December",
    "January","February","March","April","May","June"
  ];

  months.sort((a,b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

  return `
    <table class="table table-bordered table-sm text-center align-middle">
      <thead class="table-dark">
        <tr>
          <th>Month</th>
          <th>Total Class</th>
          <th>Present</th>
          <th>Absent</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${months.map(m=>{
          let v = attObj[m];

// 🔥 fallback for 2025-06 type keys
if (!v) {
  const reverseMap = {
    January:"01", February:"02", March:"03", April:"04",
    May:"05", June:"06", July:"07", August:"08",
    September:"09", October:"10", November:"11", December:"12"
  };

  const mm = reverseMap[m];
  const key = Object.keys(attObj).find(k => k.endsWith(`-${mm}`));

  if (key) v = attObj[key];
}

v = v || {};
          const total = Number(v.total)||0;
          const present = Number(v.present)||0;
          const absent = Number(v.absent)||0;
          const pct = total ? ((present/total)*100).toFixed(2) : 0;

          return `
            <tr>
              <td><b>${m}</b></td>

              <td>
  <input 
    data-key="${m}" 
    data-field="total"
    class="form-control form-control-sm text-center"
    value="${total}" 
    readonly>
</td>

<td>
  <input 
    data-key="${m}" 
    data-field="present"
    class="form-control form-control-sm text-center"
    value="${present}" 
    readonly>
</td>

<td>
  <input 
    data-key="${m}" 
    data-field="absent"
    class="form-control form-control-sm text-center"
    value="${absent}" 
    readonly>
</td>

              <td>
                <span class="${
                  pct < 75 ? 'text-danger' :
                  pct < 90 ? 'text-warning' : 'text-success'
                }">
                  ${pct}%
                </span>
              </td>

            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderTestsHtml(testsObj){
  testsObj = testsObj || {};
  const keys = Object.keys(testsObj).sort((a,b)=>{
  const n1 = parseInt(a.replace(/\D/g,'')) || 0;
  const n2 = parseInt(b.replace(/\D/g,'')) || 0;
  return n1 - n2;
});

if(!keys.length){
  return `
    <table class="tests-table">
      <thead>
        <tr>
          <th>Test</th>
          <th>Subject</th>
          <th>Full Marks</th>
          <th>Score</th>
          <th>Percentage</th>
          <th>Rank</th>
        </tr>
      </thead>
      <tbody id="testsBody"></tbody>
    </table>
  `;
}

  return `
    <table class="tests-table">
      <thead>
        <tr>
          <th>Test</th>
          <th>Subject</th>
          <th>Full Marks</th>
          <th>Score</th>
          <th>Percentage</th>
          <th>Rank</th>
        </tr>
      </thead>
      <tbody>
        ${keys.map(k=>{
          const t = testsObj[k];
          const full = Number(t.fullMarks)||0;
          let score = t.score === "AB" ? "AB" : Number(t.score)||0;

let pct = "AB";

if(score !== "AB"){
  pct = full ? ((score/full)*100).toFixed(2) : 0;
}

          return `
            <tr>
              <td>${k}</td>
              <td>${t.subject || ""}</td>
<td>${full}</td>
<td>${score === "AB" ? "AB" : Number(score).toFixed(2)}</td>
<td>${pct === "AB" ? "AB" : pct + "%"}</td>
<td>${t.rank || ""}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}
/* ---------- Dashboard rendering ---------- */
function renderDashboard(){
  // Average attendance across students (include students with months; if a student has no months, treat as 0)
  const attVals = students.map(s => avgAttendanceFor(s));
  const avgAtt = attVals.length ? +(attVals.reduce((a,b)=>a+b,0)/attVals.length).toFixed(2) : 0;
  // Average test percent: average of students' avgTestPercentFor (ignore students with 0 tests? we'll include only students with >=1 test)
  const studentsWithTests = students.filter(
  s => Object.keys(s.classTests || {}).length > 0 || Object.keys(s.mockTests || {}).length > 0
);
  const avgTest = studentsWithTests.length ? +(studentsWithTests.reduce((a,s)=>a + avgTestPercentFor(s), 0) / studentsWithTests.length).toFixed(2) : 0;
  document.getElementById('avgAttendanceChip').textContent = avgAtt + '%';
  document.getElementById('avgScoreChip').textContent = avgTest + '%';

  // Attendance chart: list student names and their avg attendance
  const labels = students.map(s => `${s.name} (R:${s.roll})`);
  const attData = students.map(s => avgAttendanceFor(s));
  const testData = students.map(s => avgTestPercentFor(s));

  const ac = document.getElementById('attendanceChart')?.getContext?.('2d');
  if(ac){
    if(attendanceChart) attendanceChart.destroy();
    attendanceChart = new Chart(ac, {
      type:'bar',
      data:{ labels, datasets:[ { label:'Avg Attendance %', data: attData, backgroundColor: attData.map(v=> v<75? '#ff6b6b': v<90? '#ffb84d':'#2ecc71') } ] },
      options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 }}}
    });
  }

  const sc = document.getElementById('scoreChart')?.getContext?.('2d');
  if(sc){
    if(scoreChart) scoreChart.destroy();
    scoreChart = new Chart(sc, {
      type:'bar',
      data:{ labels, datasets:[ { label:'Avg Test %', data: testData, backgroundColor: testData.map(v=> v<40? '#ff6b6b': v<70? '#ffb84d':'#2ecc71') } ] },
      options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, max:100 }}}
    });
  }
}

/* ---------- Mini chart drawer (Attendance vs Test % per student) ---------- */
function drawMiniChart(idx, student){
  setTimeout(()=>{
    const canvas = document.getElementById(`miniChart-${idx}`);
    if(!canvas) return;

    // destroy existing charts
    if(canvas._chart1) try{ canvas._chart1.destroy(); }catch(e){}
    if(canvas._chart2) try{ canvas._chart2.destroy(); }catch(e){}

    // create square layout
    const wrapper = canvas.parentElement;
    wrapper.innerHTML = `
      <div class="d-flex flex-wrap justify-content-center align-items-center" style="gap:14px;">
        <div class="text-center" style="width:250px;height:250px;">
          <div class="label-sm mb-1" style="font-size:0.85rem;">Attendance %</div>
          <canvas id="miniChartA-${idx}" width="350" height="200"></canvas>
        </div>
        <div class="text-center" style="width:250px;height:250px;">
          <div class="label-sm mb-1" style="font-size:0.85rem;">Test Progress %</div>
          <canvas id="miniChartT-${idx}" width="350" height="200"></canvas>
        </div>
      </div>
    `;

    // ---- Attendance Chart ----
    const months = Object.keys(student.attendance || {}).sort((a,b) => new Date(a) - new Date(b));
    const attPercents = months.map(m => calcAttendancePercent(student.attendance[m]));
    const ctxA = document.getElementById(`miniChartA-${idx}`).getContext('2d');
    if(ctxA){
      canvas._chart1 = new Chart(ctxA, {
        type: 'line',
        data: {
          labels: months.length ? months : ['No Data'],
          datasets: [{
            label: 'Attendance %',
            data: attPercents.length ? attPercents : [0],
            fill: true,
            backgroundColor: 'rgba(13,110,253,0.18)',
            borderColor: '#0d6efd',
            tension: 0.35,
            pointRadius: 2.5,
            pointBackgroundColor: '#0d6efd'
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 20 },
              grid: { color: '#f1f1f1' }
            },
            x: {
              ticks: { font: { size: 8 } },
              grid: { display: false }
            }
          }
        }
      });
    }

    // ---- Test Chart ----
    const tests = [
  ...Object.values(student.classTests || {}),
  ...Object.values(student.mockTests || {})
];

const testPercents = tests.map(t => percentOfTest(t));
    const ctxT = document.getElementById(`miniChartT-${idx}`).getContext('2d');
    if(ctxT){
      canvas._chart2 = new Chart(ctxT, {
        type: 'line',
        data: {
          labels: tests.length ? tests.map((t,i)=>`Test ${i+1}`) : ['No Tests'],
          datasets: [{
            label: 'Test %',
            data: testPercents.length ? testPercents : [0],
            fill: true,
            backgroundColor: 'rgba(25,135,84,0.18)',
            borderColor: '#198754',
            tension: 0.35,
            pointRadius: 2.5,
            pointBackgroundColor: '#198754'
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 20 },
              grid: { color: '#f1f1f1' }
            },
            x: {
              ticks: { font: { size: 8 } },
              grid: { display: false }
            }
          }
        }
      });
    }

    // update badges
    document.getElementById(`miniAtt-${idx}`).textContent = avgAttendanceFor(student) + '%';
    document.getElementById(`miniTest-${idx}`).textContent = avgTestPercentFor(student) + '%';
  }, 50);
}

/* ---------- Initial Render ---------- */
// renderStudents();  // handled by loadStudentsByYear

/* Expose for debugging */
window.renderStudents = renderStudents;
// ===== YEAR-WISE STUDENT LOADER =====
function loadStudentsByYear(year) {
  const selectedCourse = document.getElementById("filterCourse")?.value || "";

fetch(`/api/students/year/${year}?course=${selectedCourse}`)
    .then(res => res.json())
    .then(data => {
      console.log("MongoDB Data:", data);
      window.students = data;
      renderStudents();
    })
    .catch(err => {
      console.error("Failed to load students:", err);
      document.getElementById("studentsList").innerHTML =
        `<div class="alert alert-warning">
          No student data available for Academic Year <b>${year}</b>.
        </div>`;
    });
}
function showNoData(year) {
  const list = document.getElementById("studentsList");
  list.innerHTML = `
    <div class="alert alert-warning">
      No student data available for Academic Year <b>${year}</b>.
    </div>
  `;
}
const courseFilter = document.getElementById("filterCourse");

if(courseFilter){
  courseFilter.addEventListener("change", () => {
    const year = localStorage.getItem("bvcpYear") || "2025-26";
    loadStudentsByYear(year);
  });
}


function renderPagination(totalStudents){

const totalPages = Math.ceil(totalStudents / studentsPerPage);

const pagination = document.getElementById("pagination");

if(!pagination) return;

pagination.innerHTML = "";

if(totalPages <= 1) return;

let html = "";

if(currentPage > 1){
html += `<button class="btn btn-sm btn-outline-primary me-1" onclick="changePage(${currentPage-1})">Prev</button>`;
}

for(let i=1;i<=totalPages;i++){

html += `
<button 
class="btn btn-sm ${i===currentPage ? "btn-primary" : "btn-outline-primary"} me-1"
onclick="changePage(${i})">
${i}
</button>
`;

}

if(currentPage < totalPages){
html += `<button class="btn btn-sm btn-outline-primary ms-1" onclick="changePage(${currentPage+1})">Next</button>`;
}

pagination.innerHTML = html;

}

searchBox?.addEventListener("input", ()=>{
currentPage = 1;
renderStudents();
});

filterCategory?.addEventListener("change", ()=>{
currentPage = 1;
renderStudents();
});

filterGender?.addEventListener("change", ()=>{
currentPage = 1;
renderStudents();
});


sortBy?.addEventListener("change", ()=>{
currentPage = 1;
renderStudents();
});
function changePage(page){

currentPage = page;

renderStudents();

window.scrollTo({
top:0,
behavior:"smooth"
});

}