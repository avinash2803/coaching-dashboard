import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Student from "../models/student.js";
import Success from "../models/success.js";
import Notice from "../models/notice.js";
import Achievement from "../models/achievement.js";
import OpenAI from "openai";
import Analytics from "../models/analytics.js";
import Dashboardstats from "../models/dashboardstats.js";
import mongoose from "mongoose";
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const faqPath = path.join(
    __dirname,
    "../data/faqs.json"
);

const faqs = JSON.parse(
    fs.readFileSync(faqPath, "utf8")
);

const knowledgePath =
    path.join(
        __dirname,
        "../data/knowledge.txt"
    );

const knowledge =
    fs.readFileSync(
        knowledgePath,
        "utf8"
    );

    console.log("API Key:", process.env.OPENAI_API_KEY);
    const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.post("/", async (req, res) => {

    try {

        const message =
    (req.body.message || "")
    .toLowerCase()
    .trim();
    const yearMatch =
    message.match(/\d{4}-\d{2}/);

const year =
    yearMatch
        ? yearMatch[0]
        : "2025-26";


    const analytics =
    await Analytics.findOne({
        year
    }) || {};

const dashboard =
    await Dashboardstats.findOne({
        year
    }) || {};
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

            if (
    message.includes("student") ||
    message.includes("enrolled")
) {

    const total =
    await Student.countDocuments({
        year
    });

    return res.json({
        reply:
        `Currently ${total} students are enrolled in ${year}.`
    });

}

if (
    message.includes("notice")
) {

    const latest =
    await Notice.findOne({
        year
    })
    .sort({ createdAt: -1 });

    if (latest) {

        return res.json({
            reply:
            latest.title ||
            latest.notice ||
            latest.message
        });

    }
}

if (
    message.includes("attendance")
) {

    return res.json({
        reply:
        `Average attendance in ${year} is ${analytics.averageAttendance || "Not Available"}%.`
    });

}

if (
    message.includes("active")
) {

    return res.json({
        reply:
        `${analytics.activeStudents || 0} students are currently active in ${year}.`
    });

}
if (
    message.includes("dropout")
) {

    return res.json({
        reply:
        `${analytics.dropoutStudents || 0} students have dropped out in ${year}.`
    });

}
if (
    message.includes("selection rate")
) {

    return res.json({
        reply:
        `The selection rate in ${year} is ${analytics.selectionRate || "Not Available"}%.`
    });

}


if (
    message.includes("selected") ||
    message.includes("selection")
) {

    const selected =
    await Success.countDocuments({
        year
    });

    return res.json({
        reply:
        `${selected} students have been selected in ${year}.`
    });

}


if (
    message.includes("achievement") ||
    message.includes("achievements")
) {

    const achievementCount =
    await Achievement.countDocuments({
        year
    });

    return res.json({
        reply:
        `${achievementCount} achievements have been recorded in the coaching program.`
    });

}

const searchWords =
    message
        .split(" ")
        .filter(
            word =>
                word.length > 2
        );

if (searchWords.length > 0) {

    const achievement =
        await Achievement.find({
            year,
            examQualified: {
                $regex:
                    searchWords.join("|"),
                $options: "i"
            }
        });

    if (achievement.length > 0) {

        return res.json({
            reply:
            `${achievement.length} students have qualified ${achievement[0].examQualified} in ${year}.`
        });

    }

}


if (
    message.includes("qualified")
) {

    return res.json({
        reply:
        `${analytics.qualifiedStudents || 0} students have qualified various examinations in ${year}.`
    });

}
const exam =
    dashboard?.qualified?.find(
        q =>
        message.includes(
            q.name.toLowerCase()
        )
    );

if (exam) {

    return res.json({
    reply:
    `${exam.boys + exam.girls} students qualified ${exam.name} in ${year}.`
});

}

const employment =
    dashboard?.employment?.find(
        e =>
            message.includes(
                e.name.toLowerCase()
            )
    );

if (employment) {

    return res.json({
    reply:
    `${employment.boys + employment.girls} students are employed as ${employment.name} in ${year}.`
});

}
if (
    message.includes("syllabus")
) {

    return res.json({
    reply:
    `CGPSC syllabus completion in ${year} is ${cgpscProgress?.progress || 0}% and VYAPAM syllabus completion is ${vyapamProgress?.progress || 0}%.`
});

}
const syllabus =
    await mongoose.connection
    .collection("syllabus")
    .find({ year })
    .toArray();

const subject =
    syllabus.find(
        s =>
            message.includes(
                s.subject.toLowerCase()
            ) ||
            message.includes(
                s.faculty.toLowerCase()
            )
    );

if (subject) {

    return res.json({
        reply:
        `${subject.subject} is taught by ${subject.faculty}. Status: ${subject.status}. ${subject.executed} classes have been executed out of ${subject.planned} planned classes.`
    });

}

if (
    message.includes("faculty")
) {

    const facultyList =
        [...new Set(
            syllabus.map(
                s => s.faculty
            )
        )];

    return res.json({
        reply:
        `Faculty members are: ${facultyList.join(", ")}`
    });

}
if (
    message.includes("subject")
) {

    const subjects =
        syllabus.map(
            s => s.subject
        );

    return res.json({
        reply:
        subjects.join(", ")
    });

}




        for (const faq of faqs) {

            for (const keyword of faq.keywords) {

                if (message.includes(keyword)) {

                    return res.json({
                        reply: faq.answer
                    });

                }
            }
        }

        const syllabusSummary =
    syllabus
    .map(
        s =>
        `${s.subject} - ${s.faculty} - ${s.status}`
    )
    .join("\n");

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

You are the official AI Assistant of the Bhoramdev Vidyapeeth Coaching Program (BCCP).

Selected Academic Year:
${year}
Always answer according to the selected academic year.
When answering statistics or reports, always mention the academic year.
If the user does not mention a year, assume ${year}.
Program Information:
${knowledge}

Total Students:
${analytics?.totalStudents}

Active Students:
${analytics?.activeStudents}

Dropout Students:
${analytics?.dropoutStudents}

Qualified Students:
${analytics?.qualifiedStudents}

Average Attendance:
${analytics?.averageAttendance || "Not Available"}%

Selection Rate:
${analytics?.selectionRate || "Not Available"}%

CGPSC Syllabus:
${cgpscProgress?.progress || 0}%

VYAPAM Syllabus:
${vyapamProgress?.progress || 0}%

Syllabus Information:
${syllabusSummary}

Answer only questions related to:
- BCCP
- Students
- Faculty
- Attendance
- Syllabus
- Results
- Achievements
- Examinations
- Coaching facilities

Use the provided data whenever possible.

If information is unavailable, politely state that the information is not available.

Do not answer unrelated questions.
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
        completion.choices[0].message.content
    });

}

return res.json({
    reply:
    "I couldn't find information related to your question."
});

} catch (error) {

    console.error(error);

    if (
        error.code === "insufficient_quota" ||
        error.status === 429
    ) {

        return res.json({
            reply:
            "AI service quota exceeded. Please contact the coaching office for assistance."
        });

    }

    return res.json({
        reply:
        "Sorry, something went wrong."
    });

}

});

export default router;