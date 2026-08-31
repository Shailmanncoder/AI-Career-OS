import { getSessionUser } from "@/lib/auth/session";
import { MarketingNav } from "@/components/marketing/nav";
import {
  Features,
  FeatureSplit,
  FinalCta,
  Footer,
  Hero,
  HowItWorks,
  Problem,
} from "@/components/marketing/sections";
import {
  CareerMatchPreview,
  CareerSimulatorPreview,
  InterviewCoachPreview,
  ResumeOptimizerPreview,
  RoadmapPreview,
  SkillIntelligencePreview,
} from "@/components/marketing/previews";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getSessionUser();
  const isAuthenticated = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav isAuthenticated={isAuthenticated} />

      <main id="main" className="flex-1">
        <Hero isAuthenticated={isAuthenticated} />
        <Problem />
        <HowItWorks />
        <Features />

        <FeatureSplit
          id="skills"
          eyebrow="Skill intelligence"
          title="Every skill, with the evidence behind it"
          description="Skills are not a word cloud. Each one is categorised, levelled, and attached to the line in your resume that justifies it."
          bullets={[
            "Twelve categories from programming through leadership",
            "Confidence values separate stated evidence from inference",
            "AI estimated levels are labelled as estimates, never as verified measurements",
            "Assessment results replace estimates with recorded evidence",
          ]}
          preview={<SkillIntelligencePreview />}
        />

        <FeatureSplit
          eyebrow="Career matching"
          title="Fourteen roles, scored the same way every time"
          description="Your profile is scored against required, important, and optional skills for every role, using weights defined in the database rather than a model's opinion."
          bullets={[
            "Weighted attainment against each role's expected skill level",
            "Required skill coverage tracked separately from overall score",
            "Identical inputs always produce an identical score",
            "AI writes the explanation; the application owns the number",
          ]}
          preview={<CareerMatchPreview />}
          reverse
          className="border-t bg-muted/25"
        />

        <FeatureSplit
          id="simulator"
          eyebrow="Career simulator"
          title="See what learning a skill is actually worth"
          description="Select the skills you are considering. The matching engine recalculates your compatibility instantly, so you can compare options before spending a month on one."
          bullets={[
            "Recalculated by the same deterministic engine that produced your baseline",
            "Shows the remaining gaps after the simulated skills are acquired",
            "Every simulation is saved so you can compare paths later",
            "AI explains why those specific skills move the number",
          ]}
          preview={<CareerSimulatorPreview />}
        />

        <FeatureSplit
          id="roadmap"
          eyebrow="Personalized roadmap"
          title="A plan ordered by dependency, not by popularity"
          description="Your gaps, your weekly hours, and your existing foundation produce a phased plan with learning, practice, projects, and checkpoints."
          bullets={[
            "30, 60, or 90 day horizons sized to your weekly time budget",
            "Prerequisite skills are sequenced before the skills that need them",
            "Real learning resources from official documentation and open courses",
            "Task completion persists and feeds your progress tracking",
          ]}
          preview={<RoadmapPreview />}
          reverse
          className="border-t bg-muted/25"
        />

        <FeatureSplit
          eyebrow="Resume optimization"
          title="Better wording, never invented experience"
          description="Rewrites are constrained to content already present in your resume. Where a metric is missing, you get a placeholder to fill in rather than a fabricated number."
          bullets={[
            "ATS readiness score with keyword coverage and section completeness",
            "Missing keywords drawn from the target role's weighted skills",
            "Formatting warnings for layouts that parse badly",
            "No fabricated employers, degrees, certifications, or metrics",
          ]}
          preview={<ResumeOptimizerPreview />}
        />

        <FeatureSplit
          eyebrow="Interview coach"
          title="One question at a time, scored on five dimensions"
          description="Choose the role, seniority, and interview type. Answer, get a scored breakdown with specific feedback, then face a follow-up shaped by what you just said."
          bullets={[
            "Technical, behavioural, or mixed formats",
            "Relevance, technical accuracy, structure, communication, completeness",
            "Follow-up questions adapt to your answer and your recorded skill gaps",
            "Full sessions are stored so you can review progress over time",
          ]}
          preview={<InterviewCoachPreview />}
          reverse
          className="border-t bg-muted/25"
        />

        <FinalCta isAuthenticated={isAuthenticated} />
      </main>

      <Footer />
    </div>
  );
}
