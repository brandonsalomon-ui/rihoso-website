import { NextResponse } from "next/server";
import { clean, EMAIL_RE, sendNotification } from "@/lib/email";

export const runtime = "nodejs";

const ROLES: Record<string, string> = {
  guardian: "Parent or guardian",
  student: "Student (13 or older)",
  educator: "Teacher or school staff",
};

const YEARS = ["Grade 9", "Grade 10", "Grade 11", "Grade 12", "College", "Other"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["After school (3–5 pm)", "Early evening (5–7 pm)", "Evening (7–9 pm)", "Weekend daytime"];

/**
 * Students & Schools interest form. Emails RIHOSO; nothing is stored in the database.
 * No date of birth is collected. A student must give a parent or guardian's contact,
 * and RIHOSO contacts the guardian before a student takes part (see the Privacy Policy).
 */
export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (clean(data.website)) return NextResponse.json({ ok: true }); // honeypot

  const role = ROLES[clean(data.role, 20)];
  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const studentName = clean(data.studentName, 120);
  const school = clean(data.school, 160);
  const year = YEARS.includes(clean(data.year, 20)) ? clean(data.year, 20) : "";
  const guardianName = clean(data.guardianName, 120);
  const guardianEmail = clean(data.guardianEmail, 200);
  const days = (Array.isArray(data.days) ? data.days : []).filter((d): d is string => typeof d === "string" && DAYS.includes(d));
  const time = TIMES.includes(clean(data.time, 40)) ? clean(data.time, 40) : "";
  const message = clean(data.message, 3000);

  if (!role || !name || !EMAIL_RE.test(email) || !school) {
    return NextResponse.json({ error: "Please fill in who you are, your name, a valid email and the school." }, { status: 400 });
  }
  if (role === ROLES.guardian && !studentName) {
    return NextResponse.json({ error: "Please add the student's first name." }, { status: 400 });
  }
  if (role === ROLES.student && (!guardianName || !EMAIL_RE.test(guardianEmail))) {
    return NextResponse.json(
      { error: "Students: please add a parent or guardian's name and email. We contact them before you take part." },
      { status: 400 }
    );
  }
  if (role === ROLES.student && data.age13 !== true) {
    return NextResponse.json({ error: "Please confirm you are 13 or older, or ask a parent or guardian to fill in the form." }, { status: 400 });
  }

  const result = await sendNotification({
    subject: `Students & Schools interest: ${school}`,
    replyTo: role === ROLES.student ? guardianEmail : email,
    rows: [
      ["From", role],
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Student", role === ROLES.student ? name : studentName],
      ["School", school],
      ["School year", year],
      ["Parent/guardian", role === ROLES.student ? `${guardianName} <${guardianEmail}>` : role === ROLES.guardian ? name : ""],
      ["Best days", days.join(", ")],
      ["Best time", time],
      ["Message", message],
    ],
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Sorry — the form couldn't be sent just now. Please try again or email info@rihoso.com." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
