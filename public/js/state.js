// state.js
const STORAGE_KEY = 'students_app_v2';

let students = [
  {
    roll:101,
    name:"Vivekanand",
    studentMobile:"6268733749",
    father:"Mr. Mohan",
    fatherMobile:"7987252079",
    email:"vkkoshle2003@gmail.com",
    dob:"2003-02-28",
    gender:"MALE",
    category:"SC",
    course:"CGPSC",
    admissionDate:"2025-06-17",
    aadhaar:"XXXXXXXX6132",
    rank:"1",
    bloodGroup:"B+",
    area:"Tamia",
    photo:"",
    attendance:{
      "2025-06":{total:21,present:20,absent:1},
      "2025-07":{total:22,present:18,absent:4}
    },
    tests:{
      "Test 1":{fullMarks:40,correct:10,incorrect:2}
    },
    remarks:"Good progress"
  },
  {
    roll:102,
    name:"Durgesh Yadav",
    studentMobile:"6265308507",
    father:"Reekhee Yadav",
    fatherMobile:"9329104867",
    email:"surekhayadav9674@gmail.com",
    dob:"2003-12-30",
    gender:"MALE",
    category:"OBC",
    course:"CGPSC",
    admissionDate:"2025-06-12",
    aadhaar:"XXXXXXXX1397",
    rank:"2",
    bloodGroup:"O+",
    area:"Patalkot",
    photo:"",
    attendance:{
      "2025-06":{total:21,present:18,absent:3}
    },
    tests:{
      "Test 1":{fullMarks:40,correct:15,incorrect:3}
    },
    remarks:""
  }
];

// load saved data safely
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  try {
    students.length = 0;
    JSON.parse(saved).forEach(s => students.push(s));
  } catch (e) {}
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// expose globally
window.students = students;
window.saveData = saveData;
