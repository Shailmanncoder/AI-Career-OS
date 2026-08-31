import { PrismaClient, type SkillCategory, type SkillRequirement } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SKILL_SEEDS } from "../lib/data/skills";
import { CAREER_ROLE_SEEDS } from "../lib/data/careers";
import { LEARNING_RESOURCE_SEEDS } from "../lib/data/resources";
import { computeCareerMatch, computeSkillGaps, rankCareerMatches } from "../lib/engine/scoring";
import type { CandidateSkillInput, RoleSkillInput } from "../lib/engine/types";
import { fallbackRoadmapPlan } from "../lib/services/fallbacks";
import { DEMO_CANDIDATE_NAME, DEMO_EMAIL, DEMO_PASSWORD } from "../lib/data/demo";

const prisma = new PrismaClient();

const DEMO_RESUME_TEXT = `Aarav Mehta
Bengaluru, India | aarav.mehta@example.com | github.com/example-aarav | linkedin.com/in/example-aarav

SUMMARY
Frontend focused developer with two years of product experience building React interfaces for a logistics SaaS.
Comfortable owning a feature from design handoff to release. Currently moving toward full stack ownership.

EXPERIENCE
Frontend Developer | Northwind Logistics | Jun 2023 - Present
- Rebuilt the shipment tracking dashboard in React and TypeScript, cutting first contentful paint from 3.4s to 1.2s
- Introduced a shared component library used by 4 product squads, removing roughly 6000 lines of duplicated markup
- Partnered with design to ship an accessibility pass that resolved 38 WCAG violations across the booking flow
- Added Vitest and Testing Library coverage to the checkout module, raising it from 0 to 71 percent

Junior Web Developer | Fieldstone Studio | Aug 2022 - May 2023
- Built marketing sites in HTML, CSS and JavaScript for 11 client engagements
- Automated image optimisation in the build pipeline, reducing average page weight by 42 percent
- Maintained WordPress and static site deployments for existing retainer clients

PROJECTS
Transit Board - Realtime bus arrival board
- React and TypeScript frontend consuming a public transit REST API with polling and optimistic UI
- Deployed as a static site with a small Node.js proxy to hide the upstream API key

Ledger Lite - Personal expense tracker
- Next.js app with server rendered reports and a PostgreSQL database accessed through Prisma
- Implemented CSV import with client side validation before submission

EDUCATION
Bachelor of Engineering, Information Science | Visvesvaraya Technological University | 2018 - 2022

SKILLS
JavaScript, TypeScript, React, Next.js, HTML, CSS, Tailwind CSS, Redux, Node.js, REST APIs, Git, Vitest,
PostgreSQL, Prisma, Figma, Web Performance, Accessibility

CERTIFICATIONS
Responsive Web Design - freeCodeCamp - 2022
`;

const DEMO_SKILL_LEVELS: Array<{ slug: string; level: number; confidence: number; evidence: string }> = [
  { slug: "javascript", level: 82, confidence: 0.92, evidence: "Primary language across both roles and all listed projects." },
  { slug: "react", level: 80, confidence: 0.9, evidence: "Rebuilt the shipment tracking dashboard and owns a shared component library." },
  { slug: "html-css", level: 84, confidence: 0.9, evidence: "Built marketing sites across 11 client engagements." },
  { slug: "typescript", level: 68, confidence: 0.82, evidence: "Used alongside React in the current role and in Transit Board." },
  { slug: "git", level: 72, confidence: 0.75, evidence: "Listed in skills and implied by multi-squad collaboration." },
  { slug: "tailwind-css", level: 64, confidence: 0.7, evidence: "Listed in the skills section without a supporting bullet." },
  { slug: "redux", level: 55, confidence: 0.6, evidence: "Listed in the skills section only." },
  { slug: "web-performance", level: 66, confidence: 0.85, evidence: "Reduced first contentful paint from 3.4s to 1.2s." },
  { slug: "accessibility", level: 61, confidence: 0.85, evidence: "Resolved 38 WCAG violations in the booking flow." },
  { slug: "testing", level: 52, confidence: 0.8, evidence: "Raised checkout module coverage from 0 to 71 percent with Vitest." },
  { slug: "rest-api", level: 48, confidence: 0.7, evidence: "Consumed a public transit REST API and wrote a small Node proxy." },
  { slug: "nextjs", level: 45, confidence: 0.65, evidence: "Built Ledger Lite with server rendered reports." },
  { slug: "nodejs", level: 34, confidence: 0.55, evidence: "Wrote a small proxy service, no production backend ownership stated." },
  { slug: "postgresql", level: 30, confidence: 0.5, evidence: "Used through Prisma in a personal project." },
  { slug: "sql", level: 28, confidence: 0.45, evidence: "Implied by PostgreSQL usage rather than stated directly." },
  { slug: "prisma", level: 32, confidence: 0.55, evidence: "Used as the database layer in Ledger Lite." },
  { slug: "figma", level: 44, confidence: 0.6, evidence: "Works from design handoff with the design team." },
  { slug: "problem-solving", level: 62, confidence: 0.6, evidence: "Inferred from performance and refactoring work described in bullets." },
  { slug: "collaboration", level: 66, confidence: 0.65, evidence: "Partnered with design and served four product squads." },
];

const DEMO_ANALYSIS = {
  summary:
    "Frontend developer with roughly two years of product experience, strongest in React, TypeScript and browser performance. Backend and data work appears only in personal projects, which is the main constraint on full stack roles today.",
  fullName: "Aarav Mehta",
  headline: "Frontend Developer",
  yearsExperience: 2.5,
  overallScore: 74,
  atsScore: 71,
  education: [
    {
      institution: "Visvesvaraya Technological University",
      degree: "Bachelor of Engineering",
      field: "Information Science",
      period: "2018 - 2022",
      highlights: [],
    },
  ],
  experience: [
    {
      company: "Northwind Logistics",
      title: "Frontend Developer",
      period: "Jun 2023 - Present",
      location: "Bengaluru, India",
      highlights: [
        "Rebuilt the shipment tracking dashboard in React and TypeScript, cutting first contentful paint from 3.4s to 1.2s",
        "Introduced a shared component library used by 4 product squads",
        "Resolved 38 WCAG violations across the booking flow",
        "Raised checkout module test coverage from 0 to 71 percent",
      ],
    },
    {
      company: "Fieldstone Studio",
      title: "Junior Web Developer",
      period: "Aug 2022 - May 2023",
      location: "Bengaluru, India",
      highlights: [
        "Built marketing sites for 11 client engagements",
        "Reduced average page weight by 42 percent through build pipeline image optimisation",
      ],
    },
  ],
  projects: [
    {
      name: "Transit Board",
      description:
        "Realtime bus arrival board with a React and TypeScript frontend consuming a public transit REST API, deployed with a small Node.js proxy.",
      technologies: ["React", "TypeScript", "Node.js", "REST API Design"],
      link: undefined,
    },
    {
      name: "Ledger Lite",
      description:
        "Personal expense tracker built with Next.js, server rendered reports, PostgreSQL and Prisma, including validated CSV import.",
      technologies: ["Next.js", "PostgreSQL", "Prisma ORM"],
      link: undefined,
    },
  ],
  certifications: [{ name: "Responsive Web Design", issuer: "freeCodeCamp", year: "2022" }],
  achievements: [
    "Cut first contentful paint on the primary dashboard by 65 percent",
    "Removed roughly 6000 lines of duplicated markup through a shared component library",
  ],
  careerSignals: [
    {
      role: "Frontend Developer",
      confidence: 0.92,
      reasoning: "Both roles are frontend, and every quantified outcome is a browser or interface result.",
    },
    {
      role: "Full Stack Developer",
      confidence: 0.58,
      reasoning: "Backend and database work is present but confined to personal projects rather than production ownership.",
    },
    {
      role: "UI/UX Designer",
      confidence: 0.31,
      reasoning: "Works from design handoff and led an accessibility pass, but no research or design ownership is stated.",
    },
  ],
  strengths: [
    "Every experience bullet carries a measurable outcome",
    "Performance and accessibility work is unusually well quantified for this experience level",
    "Projects demonstrate curiosity beyond the day job",
  ],
  weaknesses: [
    "Backend and database exposure is limited to personal projects",
    "No deployment, container, or cloud experience is stated anywhere",
    "The summary does not name a target role",
  ],
  recommendations: [
    "Name a target role in the first line of the summary so reviewers can place you immediately",
    "Promote the Ledger Lite backend work into its own section to evidence server side ability",
    "Add any deployment or CI exposure, even from personal projects, as a dedicated bullet",
  ],
};

const DEMO_INTERVIEW = {
  messages: [
    {
      role: "INTERVIEWER" as const,
      content:
        "Tell me about a project you are proud of, and walk me through one technical decision you made in it.",
      score: null,
      strengths: [] as string[],
      improvements: [] as string[],
    },
    {
      role: "CANDIDATE" as const,
      content:
        "I rebuilt our shipment tracking dashboard. The old version fetched every shipment on load and rendered them all, so first contentful paint was around 3.4 seconds. I moved the list to server driven pagination and virtualised the table rows. The decision I spent most time on was whether to cache shipment state on the client. I chose not to, because shipments change status frequently and stale data in logistics is worse than a slightly slower render. FCP ended up at 1.2 seconds.",
      score: 82,
      strengths: [
        "Names a specific decision and the reasoning behind it",
        "Quantifies the before and after",
        "Shows awareness of a domain constraint rather than only a technical one",
      ],
      improvements: [
        "State what you measured with, so the numbers are traceable",
        "Mention what you would revisit now with more time",
      ],
    },
    {
      role: "EVALUATION" as const,
      content:
        "Strong answer. It leads with the problem, states one decision explicitly, and closes with a measured result. The domain reasoning about stale logistics data is what lifts this above a standard performance story.",
      score: 82,
      strengths: [] as string[],
      improvements: [] as string[],
    },
    {
      role: "INTERVIEWER" as const,
      content:
        "You have mostly worked on the frontend. Describe how you would design the API that dashboard consumes if the backend were yours to build.",
      score: null,
      strengths: [] as string[],
      improvements: [] as string[],
    },
  ],
};

async function seedSkills() {
  for (const skill of SKILL_SEEDS) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      create: {
        slug: skill.slug,
        name: skill.name,
        category: skill.category as SkillCategory,
        description: skill.description,
        aliases: skill.aliases,
      },
      update: {
        name: skill.name,
        category: skill.category as SkillCategory,
        description: skill.description,
        aliases: skill.aliases,
      },
    });
  }
  return prisma.skill.findMany();
}

async function seedCareers(skillIdBySlug: Map<string, string>) {
  for (const role of CAREER_ROLE_SEEDS) {
    const created = await prisma.careerRole.upsert({
      where: { slug: role.slug },
      create: {
        slug: role.slug,
        title: role.title,
        category: role.category,
        shortDescription: role.shortDescription,
        description: role.description,
        demandIndex: role.demandIndex,
        responsibilities: role.responsibilities,
        learningAreas: role.learningAreas,
      },
      update: {
        title: role.title,
        category: role.category,
        shortDescription: role.shortDescription,
        description: role.description,
        demandIndex: role.demandIndex,
        responsibilities: role.responsibilities,
        learningAreas: role.learningAreas,
      },
    });

    for (const roleSkill of role.skills) {
      const skillId = skillIdBySlug.get(roleSkill.skill);
      if (!skillId) throw new Error(`Unknown skill slug in career seed: ${roleSkill.skill}`);

      await prisma.careerRoleSkill.upsert({
        where: { careerRoleId_skillId: { careerRoleId: created.id, skillId } },
        create: {
          careerRoleId: created.id,
          skillId,
          requirement: roleSkill.requirement as SkillRequirement,
          weight: roleSkill.weight,
          requiredLevel: roleSkill.requiredLevel,
        },
        update: {
          requirement: roleSkill.requirement as SkillRequirement,
          weight: roleSkill.weight,
          requiredLevel: roleSkill.requiredLevel,
        },
      });
    }
  }
}

async function seedResources(skillIdBySlug: Map<string, string>) {
  for (const resource of LEARNING_RESOURCE_SEEDS) {
    const skillId = skillIdBySlug.get(resource.skill);
    if (!skillId) throw new Error(`Unknown skill slug in resource seed: ${resource.skill}`);

    await prisma.learningResource.upsert({
      where: { skillId_url: { skillId, url: resource.url } },
      create: {
        skillId,
        title: resource.title,
        provider: resource.provider,
        url: resource.url,
        type: resource.type,
        difficulty: resource.difficulty,
        estimateHrs: resource.estimateHrs,
      },
      update: {
        title: resource.title,
        provider: resource.provider,
        type: resource.type,
        difficulty: resource.difficulty,
        estimateHrs: resource.estimateHrs,
      },
    });
  }
}

async function seedDemoCandidate(
  skillIdBySlug: Map<string, string>,
  skillIdByName: Map<string, string>,
) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const lookupSkillId = (value: string | undefined) =>
    value ? (skillIdByName.get(value) ?? skillIdBySlug.get(value) ?? null) : null;

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      name: `${DEMO_CANDIDATE_NAME} (Demo)`,
      passwordHash,
      isDemo: true,
    },
    update: { passwordHash, isDemo: true, name: `${DEMO_CANDIDATE_NAME} (Demo)` },
  });

  await prisma.resume.deleteMany({ where: { userId: user.id } });
  await prisma.candidateSkill.deleteMany({ where: { userId: user.id } });
  await prisma.careerMatch.deleteMany({ where: { userId: user.id } });
  await prisma.skillGap.deleteMany({ where: { userId: user.id } });
  await prisma.roadmap.deleteMany({ where: { userId: user.id } });
  await prisma.assessment.deleteMany({ where: { userId: user.id } });
  await prisma.interviewSession.deleteMany({ where: { userId: user.id } });
  await prisma.careerSimulation.deleteMany({ where: { userId: user.id } });
  await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
  await prisma.learningProgress.deleteMany({ where: { userId: user.id } });

  const fullStack = await prisma.careerRole.findUniqueOrThrow({
    where: { slug: "full-stack-developer" },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      educationLevel: "Bachelor's Degree",
      currentRole: "Frontend Developer",
      yearsExperience: 2.5,
      targetCareerId: fullStack.id,
      learningStyle: "PROJECTS",
      weeklyLearningHrs: 8,
      location: "Bengaluru, India",
      onboardingDone: true,
    },
    update: {
      currentRole: "Frontend Developer",
      yearsExperience: 2.5,
      targetCareerId: fullStack.id,
      learningStyle: "PROJECTS",
      weeklyLearningHrs: 8,
      onboardingDone: true,
    },
  });

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      fileName: "aarav-mehta-demo-resume.pdf",
      mimeType: "application/pdf",
      fileSize: DEMO_RESUME_TEXT.length,
      extractedText: DEMO_RESUME_TEXT,
      charCount: DEMO_RESUME_TEXT.length,
      status: "READY",
      isActive: true,
      analysis: {
        create: {
          summary: DEMO_ANALYSIS.summary,
          fullName: DEMO_ANALYSIS.fullName,
          headline: DEMO_ANALYSIS.headline,
          yearsExperience: DEMO_ANALYSIS.yearsExperience,
          overallScore: DEMO_ANALYSIS.overallScore,
          atsScore: DEMO_ANALYSIS.atsScore,
          education: DEMO_ANALYSIS.education,
          experience: DEMO_ANALYSIS.experience,
          projects: DEMO_ANALYSIS.projects,
          certifications: DEMO_ANALYSIS.certifications,
          achievements: DEMO_ANALYSIS.achievements,
          careerSignals: DEMO_ANALYSIS.careerSignals,
          strengths: DEMO_ANALYSIS.strengths,
          weaknesses: DEMO_ANALYSIS.weaknesses,
          recommendations: DEMO_ANALYSIS.recommendations,
          modelUsed: "seeded-demo-data",
          isFallback: false,
        },
      },
    },
  });

  const candidateSkills: CandidateSkillInput[] = [];
  for (const entry of DEMO_SKILL_LEVELS) {
    const skillId = skillIdBySlug.get(entry.slug);
    if (!skillId) throw new Error(`Unknown skill slug in demo seed: ${entry.slug}`);
    await prisma.candidateSkill.create({
      data: {
        userId: user.id,
        skillId,
        level: entry.level,
        confidence: entry.confidence,
        evidence: entry.evidence,
        source: "RESUME",
      },
    });
    candidateSkills.push({ skillId, level: entry.level, confidence: entry.confidence });
  }

  const roles = await prisma.careerRole.findMany({
    include: { roleSkills: { include: { skill: true } } },
  });

  const computed = roles.map((role) => {
    const roleSkills: RoleSkillInput[] = role.roleSkills.map((roleSkill) => ({
      skillId: roleSkill.skillId,
      skillName: roleSkill.skill.name,
      requirement: roleSkill.requirement as SkillRequirement,
      weight: roleSkill.weight,
      requiredLevel: roleSkill.requiredLevel,
    }));
    return {
      role,
      roleSkills,
      match: computeCareerMatch(candidateSkills, roleSkills),
      gaps: computeSkillGaps(candidateSkills, roleSkills),
    };
  });

  const ranked = rankCareerMatches(
    computed.map((entry) => ({ careerRoleId: entry.role.id, score: entry.match.score })),
  );
  const rankByRole = new Map(ranked.map((entry) => [entry.careerRoleId, entry.rank]));

  for (const entry of computed) {
    await prisma.careerMatch.create({
      data: {
        userId: user.id,
        careerRoleId: entry.role.id,
        score: entry.match.score,
        coverage: entry.match.coverage,
        requiredMet: entry.match.requiredMet,
        requiredTotal: entry.match.requiredTotal,
        rank: rankByRole.get(entry.role.id) ?? 0,
        strengths: [],
        focusAreas: [],
      },
    });

    const gapRows = entry.gaps.filter((gap) => gap.gap > 0);
    if (gapRows.length > 0) {
      await prisma.skillGap.createMany({
        data: gapRows.map((gap) => ({
          userId: user.id,
          careerRoleId: entry.role.id,
          skillId: gap.skillId,
          currentLevel: gap.currentLevel,
          requiredLevel: gap.requiredLevel,
          gap: gap.gap,
          priority: gap.priority,
          priorityScore: gap.priorityScore,
          weight: gap.weight,
        })),
      });
    }
  }

  const fullStackEntry = computed.find((entry) => entry.role.slug === "full-stack-developer");
  if (!fullStackEntry) throw new Error("Full stack role missing from computed matches");

  const plan = fallbackRoadmapPlan({
    roleTitle: fullStack.title,
    horizonWeeks: 12,
    weeklyHours: 8,
    learningStyle: "PROJECTS",
    yearsExperience: 2.5,
    currentStrengths: DEMO_SKILL_LEVELS.slice(0, 5).map((entry) => ({
      name: SKILL_SEEDS.find((skill) => skill.slug === entry.slug)?.name ?? entry.slug,
      level: entry.level,
    })),
    gaps: fullStackEntry.gaps
      .filter((gap) => gap.gap > 0)
      .slice(0, 10)
      .map((gap) => ({
        name: gap.skillName,
        currentLevel: gap.currentLevel,
        requiredLevel: gap.requiredLevel,
        priority: gap.priority,
      })),
    learningAreas: fullStack.learningAreas,
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      userId: user.id,
      careerRoleId: fullStack.id,
      horizon: "DAYS_90",
      weeklyHours: 8,
      title: plan.title,
      summary: plan.summary,
      isActive: true,
      isFallback: false,
      phases: {
        create: plan.phases.map((phase, phaseIndex) => ({
          order: phaseIndex + 1,
          title: phase.title,
          focus: phase.focus,
          weekStart: phase.weekStart,
          weekEnd: phase.weekEnd,
          tasks: {
            create: phase.tasks.map((task, taskIndex) => ({
              order: taskIndex + 1,
              kind: task.kind,
              title: task.title,
              objective: task.objective,
              estimateHrs: task.estimateHours,
              completed: phaseIndex === 0,
              completedAt: phaseIndex === 0 ? new Date() : null,
              skillId: lookupSkillId(task.skill),
            })),
          },
        })),
      },
    },
    include: { phases: { include: { tasks: true } } },
  });

  const nodeSkillId = skillIdBySlug.get("nodejs");
  if (nodeSkillId) {
    const assessment = await prisma.assessment.create({
      data: {
        userId: user.id,
        skillId: nodeSkillId,
        title: "Node.js Practice Assessment",
        difficulty: "INTERMEDIATE",
        questions: {
          create: [
            {
              order: 1,
              kind: "MULTIPLE_CHOICE",
              prompt: "In a Node.js HTTP handler, what is the main risk of doing CPU heavy work synchronously?",
              options: [
                "The request will be retried automatically",
                "The event loop is blocked, so all other requests stall",
                "Node.js will spawn a new thread for the request",
                "The response will be streamed in chunks",
              ],
              correctOption: 1,
              expectedPoints: [],
              explanation: "Node.js runs application code on a single event loop thread.",
              points: 10,
            },
            {
              order: 2,
              kind: "SHORT_ANSWER",
              prompt: "Describe how you would prevent one slow downstream dependency from taking down a Node.js API.",
              options: [],
              correctOption: null,
              expectedPoints: [
                "Timeouts on outbound calls",
                "Retries with backoff, bounded",
                "Circuit breaking or graceful degradation",
                "Observability so the failure is visible",
              ],
              explanation: "Strong answers bound the failure rather than only logging it.",
              points: 10,
            },
            {
              order: 3,
              kind: "PRACTICAL",
              prompt: "Walk through how you would structure an Express service so that business logic can be tested without HTTP.",
              options: [],
              correctOption: null,
              expectedPoints: [
                "Separating route handlers from business logic",
                "Dependency injection or explicit parameters",
                "Testing the logic layer directly",
              ],
              explanation: "The goal is a testable core independent of the transport layer.",
              points: 10,
            },
          ],
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: assessment.id,
        userId: user.id,
        status: "SCORED",
        score: 63,
        earnedPoints: 19,
        totalPoints: 30,
        feedback:
          "Solid grasp of the event loop and testable structure. Resilience answer covered timeouts but not circuit breaking or graceful degradation.",
        submittedAt: new Date(),
        answers: {
          create: [
            {
              questionId: assessment.questions[0].id,
              selectedOption: 1,
              isCorrect: true,
              earnedPoints: 10,
              feedback: "Correct. Blocking the event loop stalls every concurrent request.",
            },
            {
              questionId: assessment.questions[1].id,
              responseText:
                "I would set a timeout on the outbound call and log when it fires, then return a cached value if there is one.",
              isCorrect: false,
              earnedPoints: 4,
              feedback:
                "Timeouts and fallback caching are covered. Missing: bounded retries with backoff and circuit breaking so a persistent failure stops being retried.",
            },
            {
              questionId: assessment.questions[2].id,
              responseText:
                "Keep the route handler thin. It parses the request, calls a service function that takes plain arguments, and maps the result to a response. Then the service is unit tested directly.",
              isCorrect: false,
              earnedPoints: 5,
              feedback: "Good separation of concerns. Add how dependencies such as the database are substituted in tests.",
            },
          ],
        },
      },
    });

    await prisma.activityEvent.create({
      data: {
        userId: user.id,
        kind: "ASSESSMENT_SCORED",
        label: "Scored 63 on the Node.js practice assessment",
        value: attempt.score,
      },
    });
  }

  const interview = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      careerRoleId: fullStack.id,
      kind: "MIXED",
      experience: "mid",
      status: "ACTIVE",
      questionCount: 2,
      answeredCount: 1,
      averageScore: 82,
      messages: {
        create: DEMO_INTERVIEW.messages.map((message, index) => ({
          order: index + 1,
          role: message.role,
          content: message.content,
          score: message.score,
          strengths: message.strengths,
          improvements: message.improvements,
        })),
      },
    },
  });

  const reactSkillId = skillIdBySlug.get("react");
  const simulationSkills = ["nodejs", "postgresql", "rest-api"]
    .map((slug) => skillIdBySlug.get(slug))
    .filter((value): value is string => Boolean(value));

  const simulated = computeCareerMatch(
    [
      ...candidateSkills,
      ...simulationSkills.map((skillId) => ({ skillId, level: 75, confidence: 0.85 })),
    ],
    fullStackEntry.roleSkills,
  );

  await prisma.careerSimulation.create({
    data: {
      userId: user.id,
      careerRoleId: fullStack.id,
      baselineScore: fullStackEntry.match.score,
      projectedScore: simulated.score,
      delta: simulated.score - fullStackEntry.match.score,
      addedSkills: ["Node.js", "PostgreSQL", "REST API Design"],
      remainingGaps: computeSkillGaps(
        [
          ...candidateSkills,
          ...simulationSkills.map((skillId) => ({ skillId, level: 75, confidence: 0.85 })),
        ],
        fullStackEntry.roleSkills,
      )
        .filter((gap) => gap.gap > 0)
        .slice(0, 5)
        .map((gap) => gap.skillName),
      explanation:
        "Server side ownership is the single largest weighted deduction on this role. Adding Node.js, PostgreSQL and REST API design converts three separate required-skill gaps into met requirements at once.",
    },
  });

  const learningResource = reactSkillId
    ? await prisma.learningResource.findFirst({ where: { skillId: reactSkillId } })
    : null;

  if (learningResource) {
    await prisma.learningProgress.create({
      data: {
        userId: user.id,
        resourceId: learningResource.id,
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  await prisma.activityEvent.createMany({
    data: [
      {
        userId: user.id,
        kind: "RESUME_ANALYZED",
        label: `Analyzed ${resume.fileName}`,
        value: DEMO_ANALYSIS.overallScore,
      },
      {
        userId: user.id,
        kind: "ROADMAP_GENERATED",
        label: `Generated a 90 day roadmap for ${fullStack.title}`,
        value: roadmap.phases.reduce((total, phase) => total + phase.tasks.length, 0),
      },
      {
        userId: user.id,
        kind: "SIMULATION_RUN",
        label: `Simulated three new skills against ${fullStack.title}`,
        value: simulated.score - fullStackEntry.match.score,
      },
      {
        userId: user.id,
        kind: "INTERVIEW_STARTED",
        label: `Started a mixed interview for ${fullStack.title}`,
        value: interview.averageScore,
      },
    ],
  });

  return { user, topScore: fullStackEntry.match.score };
}

async function main() {
  const skills = await seedSkills();
  const skillIdBySlug = new Map(skills.map((skill) => [skill.slug, skill.id]));

  const skillIdByName = new Map(skills.map((skill) => [skill.name, skill.id]));

  await seedCareers(skillIdBySlug);
  await seedResources(skillIdBySlug);
  const demo = await seedDemoCandidate(skillIdBySlug, skillIdByName);

  const counts = {
    skills: await prisma.skill.count(),
    careers: await prisma.careerRole.count(),
    roleSkills: await prisma.careerRoleSkill.count(),
    resources: await prisma.learningResource.count(),
  };

  console.log("Seed complete", { ...counts, demoEmail: demo.user.email, demoTopScore: demo.topScore });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
