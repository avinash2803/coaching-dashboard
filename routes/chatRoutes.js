import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import OpenAI from "openai";

import Student from "../models/student.js";
import Success from "../models/success.js";
import Notice from "../models/notice.js";
import Achievement from "../models/achievement.js";
import Analytics from "../models/analytics.js";
import Dashboardstats from "../models/dashboardstats.js";

const router = express.Router();

/* ===================================================
   PATHS
=================================================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===================================================
   FAQ DATA
=================================================== */

const faqPath = path.join(
    __dirname,
    "../data/faqs.json"
);

const faqs = JSON.parse(
    fs.readFileSync(faqPath, "utf8")
);

/* ===================================================
   KNOWLEDGE BASE
=================================================== */

const knowledgePath = path.join(
    __dirname,
    "../data/knowledge.txt"
);

const knowledge = fs.readFileSync(
    knowledgePath,
    "utf8"
);

/* ===================================================
   OPENAI
=================================================== */

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/* ===================================================
   CHAT API
=================================================== */
function buildEmploymentSummary(achievements){

    const uniqueStudents = new Set();

    const departmentMap = {};

    achievements.forEach(item=>{

        if(item.type!=="EMPLOYMENT") return;

        uniqueStudents.add(item.studentId.toString());

        const category=item.category.trim();

        departmentMap[category]=(departmentMap[category]||0)+1;

    });

    return{

        studentsEmployed:uniqueStudents.size,

        employmentAchievements:Object.values(departmentMap)
            .reduce((a,b)=>a+b,0),

        departments:Object.entries(departmentMap)
        .map(([name,total])=>({name,total}))
        .sort((a,b)=>b.total-a.total)

    };

}


function buildQualificationSummary(achievements){

    const uniqueStudents=new Set();

    const examMap={};

    achievements.forEach(item=>{

        if(item.type!=="QUALIFICATION") return;

        uniqueStudents.add(item.studentId.toString());

        const category=item.category.trim();

        examMap[category]=(examMap[category]||0)+1;

    });

    return{

        studentsQualified:uniqueStudents.size,

        qualificationAchievements:Object.values(examMap)
            .reduce((a,b)=>a+b,0),

        exams:Object.entries(examMap)
        .map(([name,total])=>({name,total}))
        .sort((a,b)=>b.total-a.total)

    };

}
router.post("/", async (req, res) => {

try {

    /* ============================
       USER MESSAGE
    ============================ */

    const message = (
        req.body.message || ""
    )
    .trim()
    .toLowerCase();

    /* ============================
       YEAR DETECTION
    ============================ */

    const yearMatch =
        message.match(/\d{4}-\d{2}/);

    let year;

    if (yearMatch) {

        year = yearMatch[0];

    } else {

        const latest =
            await Analytics
            .findOne({})
            .sort({ year: -1 })
            .select("year");

        year =
            latest?.year || "2025-26";

    }

    /* ============================
       DATABASE
    ============================ */

    const analytics =
        await Analytics.findOne({
            year
        }) || {};

    const dashboard =
        await Dashboardstats.findOne({
            year
        }) || {};
        const achievementData = await Achievement.find({ year });
        const employmentSummary =
    buildEmploymentSummary(achievementData);

const qualificationSummary =
    buildQualificationSummary(achievementData);

    const cgpscProgress =
        await mongoose.connection
        .collection("progress")
        .findOne({
            course: "CGPSC",
            year
        });

    const vyapamProgress =
        await mongoose.connection
        .collection("progress")
        .findOne({
            course: "VYAPAM",
            year
        });

    const syllabus =
        await mongoose.connection
        .collection("syllabus")
        .find({
            year
        })
        .toArray();

/* ===================================================
   TOTAL ENROLLMENT
=================================================== */

if (
    [
        "student",
        "students",
        "enrollment",
        "enrolled",
        "admission",
        "total strength",
        "total enrollment"
    ].some(word => message.includes(word))
) {

    const total = await Student.countDocuments({ year });

    return res.json({
        reply:
`👨‍🎓 Total Enrollment

${total} students are enrolled in the academic year ${year}.`
    });

}


/* ===================================================
   ATTENDANCE
=================================================== */

if (message.includes("attendance")) {

    return res.json({

        reply:
`📊 Average Attendance

${analytics.averageAttendance || "Not Available"}%

Academic Year : ${year}`

    });

}


/* ===================================================
   ACTIVE STUDENTS
=================================================== */

if (message.includes("active")) {

    return res.json({

        reply:
`📈 Active Students

${analytics.activeStudents || 0}

Academic Year : ${year}`

    });

}


/* ===================================================
   DROPOUT
=================================================== */

if (message.includes("dropout")) {

    return res.json({

        reply:
`📉 Dropout Students

${analytics.dropoutStudents || 0}

Academic Year : ${year}`

    });

}


/* ===================================================
   SELECTION RATE
=================================================== */

if (message.includes("selection rate")) {

    return res.json({

        reply:
`🏆 Selection Rate

${analytics.selectionRate || "Not Available"}%

Academic Year : ${year}`

    });

}


/* ===================================================
   QUALIFICATION
=================================================== */

const exam = qualificationSummary.exams.find(e =>
    message.includes(e.name.toLowerCase())
);

if (

    exam ||

    message.includes("qualified") ||

    message.includes("qualification") ||

    message.includes("exam") ||

    message.includes("pass")

) {

    if (exam) {

        return res.json({

            reply:

`🎯 ${exam.name}

Qualified Students : ${exam.total}

Academic Year : ${year}`

        });

    }

    let reply = `🎯 Qualification Summary

👨‍🎓 Students Qualified : ${qualificationSummary.studentsQualified}

🏅 Qualification Achievements : ${qualificationSummary.qualificationAchievements}

Exam-wise Qualification

`;

    qualificationSummary.exams.forEach(exam => {

        reply += `• ${exam.name} : ${exam.total}\n`;

    });

    reply += `

ℹ️ Some students have qualified multiple examinations.`;

    return res.json({ reply });

}


/* ===================================================
   TOTAL SELECTED
=================================================== */

if (
    message.includes("selected") ||
    message.includes("selection")
) {

    const total =
        await Success.countDocuments({
            year
        });

    return res.json({

        reply:
`🏆 Total Selected Students

${total}

Academic Year : ${year}`

    });

}


/* ===================================================
   ACHIEVEMENTS
=================================================== */

if (
    message.includes("achievement") ||
    message.includes("achievements")
) {

    const total =
        await Achievement.countDocuments({
            year
        });

    return res.json({

        reply:
`🏅 Total Achievements

${total}

Academic Year : ${year}`

    });

}


/* ===================================================
   LATEST NOTICE
=================================================== */

if (
    message.includes("notice") ||
    message.includes("announcement")
) {

    const latest =
        await Notice.findOne({ year })
        .sort({ createdAt: -1 });

    if (latest) {

        return res.json({

            reply:
`📢 Latest Notice

${latest.title || latest.notice || latest.message}`

        });

    }

}

/* ===================================================
   EXAM WISE QUALIFIED
=================================================== */

const exam = dashboard?.qualified?.find(q =>
    message.includes(q.name.toLowerCase())
);

if (exam) {

    return res.json({

        reply:

`🏆 ${exam.name}

Qualified Students : ${exam.boys + exam.girls}

Academic Year : ${year}`

    });

}


/* ===================================================
   EMPLOYMENT
=================================================== */

const department = employmentSummary.departments.find(dep =>
    message.includes(dep.name.toLowerCase())
);

if (

    department ||

    message.includes("employment") ||

    message.includes("employed") ||

    message.includes("job") ||

    message.includes("placed")

) {

    if (department) {

        return res.json({

            reply:

`💼 ${department.name}

Total Employment : ${department.total}

Academic Year : ${year}`

        });

    }

    let reply = `💼 Employment Summary

👨‍🎓 Students Employed : ${employmentSummary.studentsEmployed}

🏅 Employment Achievements : ${employmentSummary.employmentAchievements}

Department-wise Employment

`;

    employmentSummary.departments.forEach(dep => {

        reply += `• ${dep.name} : ${dep.total}\n`;

    });

    reply += `

ℹ️ Some students have secured multiple employment selections.`;

    return res.json({ reply });

}


/* ===================================================
   SYLLABUS STATUS
=================================================== */

if (

    message.includes("syllabus") ||

    message.includes("progress")

) {

    return res.json({

        reply:

`📚 Syllabus Progress

CGPSC : ${cgpscProgress?.progress || 0}%

VYAPAM : ${vyapamProgress?.progress || 0}%

Academic Year : ${year}`

    });

}


/* ===================================================
   SUBJECT WISE SEARCH
=================================================== */

const subject = syllabus.find(s =>

    message.includes(s.subject.toLowerCase()) ||

    message.includes(s.faculty.toLowerCase())

);

if (subject) {

    return res.json({

        reply:

`📖 ${subject.subject}

👨‍🏫 Faculty : ${subject.faculty}

📅 Status : ${subject.status}

📘 Classes :

${subject.executed} / ${subject.planned}`

    });

}


/* ===================================================
   FACULTY LIST
=================================================== */

if (

    message.includes("faculty") ||

    message.includes("teacher")

) {

    const faculty = [

        ...new Set(

            syllabus.map(

                s => s.faculty

            )

        )

    ];

    return res.json({

        reply:

`👨‍🏫 Faculty Members

${faculty.join("\n")}`

    });

}


/* ===================================================
   SUBJECT LIST
=================================================== */

if (

    message.includes("subject") ||

    message.includes("subjects")

) {

    const subjects = syllabus.map(

        s => s.subject

    );

    return res.json({

        reply:

`📚 Subjects

${subjects.join("\n")}`

    });

}


/* ===================================================
   EXAM SEARCH FROM ACHIEVEMENTS
=================================================== */

const words = message
.split(" ")
.filter(w => w.length > 2);

if (words.length) {

    const achievements = await Achievement.find({

        year,

        examQualified: {

            $regex: words.join("|"),

            $options: "i"

        }

    });

    if (achievements.length) {

        return res.json({

            reply:

`🏅 ${achievements.length} students qualified

${achievements[0].examQualified}

Academic Year : ${year}`

        });

    }

}

/* ===================================================
   FAQ SEARCH
=================================================== */

for (const faq of faqs) {

    const found = faq.keywords.some(keyword =>
        message.includes(keyword.toLowerCase())
    );

    if (found) {

        return res.json({
            reply: faq.answer
        });

    }

}


/* ===================================================
   OPENAI FALLBACK
=================================================== */

const syllabusSummary = syllabus
.map(s =>
`${s.subject}
Faculty : ${s.faculty}
Status : ${s.status}
Classes : ${s.executed}/${s.planned}`
)
.join("\n\n");


if (

    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.startsWith("sk-")

) {

    const completion =
    await client.chat.completions.create({

        model: "gpt-4o-mini",

        messages: [

            {

                role: "system",

                content: `

You are the official AI Assistant of the
Bhoramdev Vidyapeeth Coaching Program (BCCP).

Always answer politely.

The current academic year is:

${year}

If the user asks without mentioning a year,
always answer using the current academic year.

If the user explicitly mentions an academic year,
answer only for that year.

Never invent data.

Use ONLY the information below.

--------------------------------------------------

PROGRAM INFORMATION

${knowledge}

--------------------------------------------------

ACADEMIC YEAR

${year}

--------------------------------------------------

TOTAL STUDENTS

${analytics.totalStudents || 0}

--------------------------------------------------

ACTIVE STUDENTS

${analytics.activeStudents || 0}

--------------------------------------------------

DROPOUT STUDENTS

${analytics.dropoutStudents || 0}

--------------------------------------------------

QUALIFIED STUDENTS

${analytics.qualifiedStudents || 0}

--------------------------------------------------

AVERAGE ATTENDANCE

${analytics.averageAttendance || "Not Available"}%

--------------------------------------------------

SELECTION RATE

${analytics.selectionRate || "Not Available"}%

--------------------------------------------------

CGPSC SYLLABUS

${cgpscProgress?.progress || 0}%

--------------------------------------------------

VYAPAM SYLLABUS

${vyapamProgress?.progress || 0}%

--------------------------------------------------

SUBJECT DETAILS

${syllabusSummary}

--------------------------------------------------

Answer ONLY questions related to:

• Students

• Enrollment

• Attendance

• Faculty

• Subjects

• Syllabus

• Achievements

• Qualified Students

• Employment

• Notices

• Library

• Coaching Centre

• BCCP

If information is unavailable simply reply:

"Sorry, this information is currently unavailable."

`

            },

            {

                role: "user",

                content: message

            }

        ]

    });

    return res.json({

        reply:
        completion
        .choices[0]
        .message
        .content

    });

}


/* ===================================================
   DEFAULT RESPONSE
=================================================== */

return res.json({

    reply:

`Sorry, I couldn't understand your question.

You can ask me about:

👨‍🎓 Enrollment

📊 Attendance

📚 Syllabus

👨‍🏫 Faculty

🏆 Achievements

💼 Employment

📢 Latest Notice

📖 Subjects`

});

}
catch (error) {

    console.error(error);

    if (

        error.code === "insufficient_quota" ||

        error.status === 429

    ) {

        return res.json({

            reply:

"AI service quota exceeded. Please contact the coaching office."

        });

    }

    return res.json({

        reply:

"Sorry, something went wrong while processing your request."

    });

}

});

export default router;