/**
 * Seed script — populates Cloudant with demo data for a full end-to-end run.
 *
 * Creates:
 *   - 1 school (school_guj_001)
 *   - 2 teachers
 *   - 1 admin
 *   - 2 classes (Grade 6A Math, Grade 6A Science)
 *   - 30 students (10 remedial, 15 on-track, 5 advanced per subject)
 *   - 5 students explicitly flagged at-risk (riskScore > 0.7)
 *   - 2 graded assessments (1 per subject) with student responses
 *   - Seeded users table for NextAuth login
 *
 * Usage: npm run seed
 *
 * ASSUMPTION: IBM Cloud credentials are set in environment or .env file.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { saveDoc, DB_NAMES } from "../lib/ibm/cloudant";
import type { Student, Teacher, Admin, Class, Assessment, StudentResponse, Question } from "../types/entities";

const SCHOOL_ID = "school_guj_001";
const HASH = await bcrypt.hash("demo1234", 10);

// ── IDs ───────────────────────────────────────────────────────────────────────
const TEACHER_MATH_ID = "teacher_priya_001";
const TEACHER_SCI_ID  = "teacher_rohit_002";
const ADMIN_ID        = "admin_principal_001";
const CLASS_MATH_ID   = "class_6a_math";
const CLASS_SCI_ID    = "class_6a_science";

// ── Helpers ───────────────────────────────────────────────────────────────────

function iso(d = new Date()): string { return d.toISOString(); }

type Level = "remedial" | "on_track" | "advanced";

function masteryFor(level: Level, subjectId: string): Record<string, Record<string, number>> {
  const scores: Record<string, number> = {};
  const topics = subjectId === "math"
    ? ["fractions", "decimals", "whole_numbers", "integers", "natural_numbers"]
    : ["living_world", "water", "food_sources", "motion_and_measurement", "magnets"];

  for (const t of topics) {
    scores[t] = level === "remedial"
      ? Math.round(20 + Math.random() * 35)       // 20–55
      : level === "on_track"
        ? Math.round(62 + Math.random() * 17)      // 62–79
        : Math.round(82 + Math.random() * 17);     // 82–99
  }
  return { [subjectId]: scores };
}

function riskFor(level: Level): { score: number; flag: boolean } {
  if (level === "remedial") return { score: 0.72 + Math.random() * 0.2, flag: true };
  if (level === "on_track") return { score: 0.3 + Math.random() * 0.25, flag: false };
  return { score: 0.05 + Math.random() * 0.15, flag: false };
}

// ── Teachers ──────────────────────────────────────────────────────────────────

async function seedTeachers() {
  const priya: Teacher = {
    _id: TEACHER_MATH_ID, type: "teacher", schoolId: SCHOOL_ID,
    name: "Priya Sharma", email: "priya@school.edu", passwordHash: HASH,
    assignedClassIds: [CLASS_MATH_ID], assignedSubjectIds: ["math"], createdAt: iso(),
  };
  const rohit: Teacher = {
    _id: TEACHER_SCI_ID, type: "teacher", schoolId: SCHOOL_ID,
    name: "Rohit Patel", email: "rohit@school.edu", passwordHash: HASH,
    assignedClassIds: [CLASS_SCI_ID], assignedSubjectIds: ["science"], createdAt: iso(),
  };
  await saveDoc(DB_NAMES.teachers, priya);
  await saveDoc(DB_NAMES.teachers, rohit);
  console.log("  ✓ Teachers seeded");
}

// ── Admin ─────────────────────────────────────────────────────────────────────

async function seedAdmin() {
  const admin: Admin = {
    _id: ADMIN_ID, type: "admin", schoolId: SCHOOL_ID,
    name: "Principal Mehta", email: "principal@school.edu", passwordHash: HASH, createdAt: iso(),
  };
  await saveDoc(DB_NAMES.admins, admin);
  console.log("  ✓ Admin seeded");
}

// ── Students ──────────────────────────────────────────────────────────────────

const FIRST_NAMES = ["Aarav","Ananya","Arjun","Bhavya","Chinmay","Diya","Farhan","Gauri","Harsh","Isha",
  "Jay","Kavya","Lakshmi","Manav","Nisha","Om","Priya","Rahul","Sneha","Tanvi",
  "Uday","Veer","Vidya","Yash","Zara","Aditya","Bhumi","Dev","Esha","Faizan"];

type StudentRow = { id: string; subjectId: string; level: Level };
const studentRows: StudentRow[] = [];

async function seedStudents() {
  const levels: Level[] = [
    ...Array(10).fill("remedial"),
    ...Array(15).fill("on_track"),
    ...Array(5).fill("advanced"),
  ];

  for (let i = 0; i < 30; i++) {
    const level = levels[i];
    const subjectId = i % 2 === 0 ? "math" : "science";
    const classId = subjectId === "math" ? CLASS_MATH_ID : CLASS_SCI_ID;
    const risk = riskFor(level);
    const id = `student_${String(i + 1).padStart(3, "0")}`;

    const student: Student = {
      _id: id, type: "student", schoolId: SCHOOL_ID,
      name: FIRST_NAMES[i] ?? `Student ${i + 1}`,
      email: `student${i + 1}@school.edu`,
      passwordHash: HASH,
      classId,
      subjectMastery: masteryFor(level, subjectId),
      learningPace: level === "remedial" ? "slow" : level === "on_track" ? "average" : "fast",
      riskFlag: risk.flag,
      riskScore: risk.score,
      createdAt: iso(),
    };

    await saveDoc(DB_NAMES.students, student);
    studentRows.push({ id, subjectId, level });
  }
  console.log("  ✓ 30 students seeded (10 remedial, 15 on-track, 5 advanced)");
  console.log(`  ✓ ${studentRows.filter(r => riskFor(r.level).flag).length} at-risk students`);
}

// ── Classes ───────────────────────────────────────────────────────────────────

async function seedClasses() {
  const mathStudentIds = studentRows.filter(r => r.subjectId === "math").map(r => r.id);
  const sciStudentIds  = studentRows.filter(r => r.subjectId === "science").map(r => r.id);

  function dist(ids: string[], rows: StudentRow[]) {
    const levels = ids.map(id => rows.find(r => r.id === id)?.level ?? "on_track");
    return {
      remedial: levels.filter(l => l === "remedial").length,
      onTrack:  levels.filter(l => l === "on_track").length,
      advanced: levels.filter(l => l === "advanced").length,
    };
  }

  const mathClass: Class = {
    _id: CLASS_MATH_ID, type: "class", schoolId: SCHOOL_ID,
    grade: 6, section: "A", subjectId: "math", subjectName: "Mathematics",
    studentIds: mathStudentIds, teacherId: TEACHER_MATH_ID,
    skillDistribution: dist(mathStudentIds, studentRows),
    updatedAt: iso(),
  };
  const sciClass: Class = {
    _id: CLASS_SCI_ID, type: "class", schoolId: SCHOOL_ID,
    grade: 6, section: "A", subjectId: "science", subjectName: "Science",
    studentIds: sciStudentIds, teacherId: TEACHER_SCI_ID,
    skillDistribution: dist(sciStudentIds, studentRows),
    updatedAt: iso(),
  };

  await saveDoc(DB_NAMES.classes, mathClass);
  await saveDoc(DB_NAMES.classes, sciClass);
  console.log("  ✓ 2 classes seeded (6A Math, 6A Science)");
}

// ── Assessments ───────────────────────────────────────────────────────────────

function sampleQuestions(subjectId: string): Question[] {
  if (subjectId === "math") return [
    { id: "q1", type: "mcq", text: "What is 3/4 + 1/4?", options: [{id:"a",text:"1"},{id:"b",text:"2"},{id:"c",text:"1/2"},{id:"d",text:"3/8"}], correctAnswer: "a", marks: 1 },
    { id: "q2", type: "mcq", text: "Which fraction is greater: 2/3 or 3/4?", options: [{id:"a",text:"2/3"},{id:"b",text:"3/4"},{id:"c",text:"Equal"},{id:"d",text:"Cannot tell"}], correctAnswer: "b", marks: 1 },
    { id: "q3", type: "short_answer", text: "Write 0.75 as a fraction in its simplest form.", correctAnswer: "3/4", marks: 2 },
  ];
  return [
    { id: "q1", type: "mcq", text: "Which of the following is a living thing?", options: [{id:"a",text:"Rock"},{id:"b",text:"Water"},{id:"c",text:"Tree"},{id:"d",text:"Glass"}], correctAnswer: "c", marks: 1 },
    { id: "q2", type: "mcq", text: "Water changes to steam at:", options: [{id:"a",text:"0°C"},{id:"b",text:"100°C"},{id:"c",text:"37°C"},{id:"d",text:"50°C"}], correctAnswer: "b", marks: 1 },
    { id: "q3", type: "short_answer", text: "Name two sources of food that come from plants.", correctAnswer: "Fruits, vegetables, grains, pulses (any two)", marks: 2 },
  ];
}

async function seedAssessments() {
  const now = iso();
  for (const [classId, subjectId, topicId] of [
    [CLASS_MATH_ID, "math", "fractions"],
    [CLASS_SCI_ID,  "science", "living_world"],
  ] as [string, string, string][]) {
    const questions = sampleQuestions(subjectId);
    const maxScore = questions.reduce((s, q) => s + q.marks, 0);
    const relevantStudents = studentRows.filter(r => r.subjectId === subjectId);

    const responses: StudentResponse[] = relevantStudents.map(({ id, level }) => {
      const scoreMultiplier = level === "remedial" ? 0.3 + Math.random() * 0.25
        : level === "on_track" ? 0.55 + Math.random() * 0.25 : 0.8 + Math.random() * 0.2;
      const score = Math.round(maxScore * scoreMultiplier);
      return {
        studentId: id,
        answers: { q1: level === "advanced" ? "a" : "b", q2: "b", q3: level === "remedial" ? "" : "correct answer" },
        score,
        maxScore,
        feedbackText: level === "remedial"
          ? "Good effort! Focus on understanding fractions step by step. Try using diagrams to visualise. You are making progress — keep going!"
          : level === "on_track"
            ? "Well done! You answered most questions correctly. Review the short-answer questions for extra marks. Keep practising daily!"
            : "Excellent work! You showed strong understanding of the topic. Challenge yourself with harder problems. Great job!",
        feedbackStatus: level === "advanced" ? "approved" : "pending_review",
        gradedAt: now,
      };
    });

    const assessment: Assessment = {
      _id: `assessment_${subjectId}_fractions_001`,
      type: "assessment", schoolId: SCHOOL_ID, classId, subjectId, topicId,
      difficulty: "medium", questions, studentResponses: responses,
      status: "graded", createdAt: now, updatedAt: now,
    };
    await saveDoc(DB_NAMES.assessments, assessment);
  }
  console.log("  ✓ 2 assessments seeded with student responses");
  console.log("  ✓ Advanced students have approved feedback; others are pending_review");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Setu — Seed Script ===\n");
  console.log("Seeding teachers…");    await seedTeachers();
  console.log("Seeding admin…");       await seedAdmin();
  console.log("Seeding students…");    await seedStudents();
  console.log("Seeding classes…");     await seedClasses();
  console.log("Seeding assessments…"); await seedAssessments();
  console.log("\n✅ Seed complete.\n");
  console.log("Login credentials (all users): demo1234");
  console.log("  Teacher (Math):    priya@school.edu");
  console.log("  Teacher (Science): rohit@school.edu");
  console.log("  Admin:             principal@school.edu");
  console.log("  Student (example): student1@school.edu\n");
}

main().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
