import type { Metadata } from "next";
import {
  Award,
  BookOpen,
  Briefcase,
  FileText,
  FolderGit2,
  Gauge,
  Lightbulb,
  ThumbsUp,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { ScoreRing } from "@/components/shared/score-ring";
import { AiEstimateBadge, OfflineEngineNotice } from "@/components/shared/ai-notice";
import { ResumeUploader } from "@/components/resume/resume-uploader";
import { ReanalyzeButton } from "@/components/resume/reanalyze-button";
import { requireSessionUser } from "@/lib/auth/session";
import { getActiveResume } from "@/lib/services/resume-service";
import { formatBytes, formatDate } from "@/lib/utils";
import {
  asArray,
  asStringArray,
  type CareerSignalEntry,
  type CertificationEntry,
  type EducationEntry,
  type ExperienceEntry,
  type ProjectEntry,
} from "@/types/analysis";

export const metadata: Metadata = { title: "Resume" };
export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const user = await requireSessionUser();
  const resume = await getActiveResume(user.id);
  const analysis = resume?.analysis ?? null;

  const experience = asArray<ExperienceEntry>(analysis?.experience);
  const education = asArray<EducationEntry>(analysis?.education);
  const projects = asArray<ProjectEntry>(analysis?.projects);
  const certifications = asArray<CertificationEntry>(analysis?.certifications);
  const signals = asArray<CareerSignalEntry>(analysis?.careerSignals);
  const achievements = asStringArray(analysis?.achievements);
  const strengths = asStringArray(analysis?.strengths);
  const weaknesses = asStringArray(analysis?.weaknesses);
  const recommendations = asStringArray(analysis?.recommendations);

  return (
    <>
      <PageHeader
        title="Resume"
        description="Upload a resume to build your skill profile. Everything downstream — matches, gaps, roadmap — is derived from this analysis."
        actions={resume ? <ReanalyzeButton resumeId={resume.id} /> : undefined}
      />

      <ResumeUploader hasExistingResume={Boolean(resume)} />

      {analysis?.isFallback ? <OfflineEngineNotice context="this resume analysis" /> : null}

      {!resume ? null : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {analysis?.fullName ?? resume.fileName}
                  <AiEstimateBadge label={analysis?.isFallback ? "Offline parsed" : "AI extracted"} />
                </CardTitle>
                <CardDescription>
                  {analysis?.headline ?? "No headline detected"} ·{" "}
                  {analysis ? `${analysis.yearsExperience} years of experience detected` : "Not analyzed"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {analysis?.summary ?? "This resume has not been analyzed yet."}
                </p>

                <Separator />

                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">File</dt>
                    <dd className="mt-0.5 truncate font-medium">{resume.fileName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Size</dt>
                    <dd className="mt-0.5 font-medium">{formatBytes(resume.fileSize)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Characters parsed</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">
                      {resume.charCount.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Uploaded</dt>
                    <dd className="mt-0.5 font-medium">{formatDate(resume.createdAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  Resume quality
                </CardTitle>
                <CardDescription>Structure, evidence, and keyword readiness.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-around gap-4">
                <ScoreRing
                  value={analysis?.overallScore ?? 0}
                  size={100}
                  label="Overall"
                  tone={(analysis?.overallScore ?? 0) >= 70 ? "success" : "warning"}
                />
                <ScoreRing
                  value={analysis?.atsScore ?? 0}
                  size={100}
                  label="ATS ready"
                  tone={(analysis?.atsScore ?? 0) >= 70 ? "success" : "warning"}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-success" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {strengths.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Nothing recorded.</li>
                  ) : (
                    strengths.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                        {item}
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-warning" />
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {weaknesses.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Nothing recorded.</li>
                  ) : (
                    weaknesses.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                        {item}
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {recommendations.length === 0 ? (
                    <li className="text-sm text-muted-foreground">Nothing recorded.</li>
                  ) : (
                    recommendations.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {signals.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Career signals
                  <AiEstimateBadge label="Inferred" />
                </CardTitle>
                <CardDescription>
                  Roles the resume points toward. These are signals, not the scored career matches.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {signals.map((signal) => (
                  <div key={signal.role} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{signal.role}</p>
                      <Badge variant="muted" className="tabular-nums">
                        {Math.round(signal.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {signal.reasoning}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {experience.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No experience entries were extracted.</p>
                ) : (
                  experience.map((entry, index) => (
                    <div key={`${entry.company}-${index}`} className="space-y-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-medium">{entry.title}</p>
                        <span className="text-xs text-muted-foreground">{entry.period ?? "—"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.company}</p>
                      {entry.highlights.length > 0 ? (
                        <ul className="space-y-1.5">
                          {entry.highlights.map((highlight, highlightIndex) => (
                            <li
                              key={highlightIndex}
                              className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                            >
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-border" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {index < experience.length - 1 ? <Separator className="mt-4" /> : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No projects were extracted.</p>
                  ) : (
                    projects.map((project, index) => (
                      <div key={`${project.name}-${index}`} className="space-y-2">
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {project.description}
                        </p>
                        {project.technologies.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {project.technologies.map((tech) => (
                              <Badge key={tech} variant="secondary" className="font-normal">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Education and credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {education.length === 0 && certifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing was extracted.</p>
                  ) : null}

                  {education.map((entry, index) => (
                    <div key={`${entry.institution}-${index}`}>
                      <p className="text-sm font-medium">{entry.degree ?? "Programme"}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.institution}
                        {entry.period ? ` · ${entry.period}` : ""}
                      </p>
                    </div>
                  ))}

                  {certifications.length > 0 ? (
                    <div className="space-y-2 border-t pt-4">
                      {certifications.map((entry, index) => (
                        <div key={`${entry.name}-${index}`} className="flex items-start gap-2">
                          <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[entry.issuer, entry.year].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>

          {achievements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {achievements.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </>
  );
}
