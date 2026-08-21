import { getRequiredSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClassesByTeacher } from "@/lib/db/class";
import { getStudentsByClass } from "@/lib/db/student";
import TeacherOverviewContent from "@/components/TeacherOverviewContent";
import TeacherNoClassMessage from "@/components/TeacherNoClassMessage";

export default async function TeacherOverviewPage() {
  const session = await getRequiredSession();
  if (!session) redirect("/login");
  if (session.role === "student") redirect("/student");

  const cls = (await getClassesByTeacher(session.userId, session.schoolId))[0];
  if (!cls) return <TeacherNoClassMessage />;

  const students = await getStudentsByClass(cls._id!, session.schoolId);
  const atRisk = students
    .filter((student) => student.riskFlag)
    .map(({ _id, name, riskScore, learningPace }) => ({ _id: _id!, name, riskScore, learningPace }));

  return <TeacherOverviewContent
    grade={cls.grade}
    section={cls.section}
    subjectName={cls.subjectName}
    classId={cls._id!}
    subjectId={cls.subjectId}
    sessionId={`${session.userId}_chat`}
    totalStudents={students.length}
    students={atRisk}
    distribution={cls.skillDistribution}
  />;
}
