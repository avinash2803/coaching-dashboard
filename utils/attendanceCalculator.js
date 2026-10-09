import Student from "../models/student.js";

export const ATTENDANCE_MONTHS = [
    "June", "July", "August", "September",
    "October", "November", "December", "January",
    "February", "March", "April", "May"
];

// Approved batch capacities by academic year.
const BATCH_CAPACITY = {
    "2025-26": 100,
    "2026-27": 125
};

function percentage(presentDays, maximumDays) {
    return maximumDays > 0
        ? Number(((presentDays / maximumDays) * 100).toFixed(1))
        : null;
}

/**
 * The single source of truth for attendance calculations.
 * `year` may be a specific academic year or "all".
 */
export async function calculateAttendanceForYear(year = "all") {
    const filter = {
        course: { $in: ["CGPSC", "VYAPAM"] }
    };

    if (year && String(year).toLowerCase() !== "all") {
        filter.year = year;
    }

    const students = await Student.find(filter)
        .select("course year attendance")
        .lean();

    const batches = {};

    for (const courseName of ["CGPSC", "VYAPAM"]) {
        const courseStudents = students.filter(
            student => student.course === courseName
        );

        let totalPresentDays = 0;
        let totalMaximumDays = 0;
        const monthlyAttendance = {};

        for (const month of ATTENDANCE_MONTHS) {
            const studentsByYear = {};

            for (const student of courseStudents) {
                const attendance = student.attendance?.[month];
                const workingDays = Number(attendance?.total) || 0;

                if (!attendance || workingDays <= 0) continue;

                const studentYear = student.year || year || "unknown";

                if (!studentsByYear[studentYear]) {
                    studentsByYear[studentYear] = {
                        workingDays,
                        presentDays: 0
                    };
                }

                studentsByYear[studentYear].presentDays +=
                    Number(attendance.present) || 0;
            }

            let monthlyPresentDays = 0;
            let monthlyMaximumDays = 0;

            for (const [studentYear, data] of Object.entries(studentsByYear)) {
                const capacity = BATCH_CAPACITY[studentYear] || 125;

                monthlyPresentDays += data.presentDays;
                monthlyMaximumDays += data.workingDays * capacity;
            }

            monthlyAttendance[month] = percentage(
                monthlyPresentDays,
                monthlyMaximumDays
            );

            // Months without uploaded attendance do not affect the overall rate.
            if (monthlyMaximumDays > 0) {
                totalPresentDays += monthlyPresentDays;
                totalMaximumDays += monthlyMaximumDays;
            }
        }

        batches[courseName] = {
            totalPresentDays,
            totalMaximumDays,
            average: percentage(totalPresentDays, totalMaximumDays),
            monthlyAttendance,
            // Chart.js can show null as a gap for months with no uploaded data.
            monthlyAverage: ATTENDANCE_MONTHS.map(
                month => monthlyAttendance[month]
            )
        };
    }

    const totalPresentDays =
        batches.CGPSC.totalPresentDays + batches.VYAPAM.totalPresentDays;
    const totalMaximumDays =
        batches.CGPSC.totalMaximumDays + batches.VYAPAM.totalMaximumDays;

    return {
        year,
        months: ATTENDANCE_MONTHS,
        batches,
        totalPresentDays,
        totalMaximumDays,
        overallAverage: percentage(totalPresentDays, totalMaximumDays)
    };
}
