import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ResumeRewritePayload } from "@/lib/validation/ai";

export type ExportFormat = "docx" | "pdf";

const INK = { r: 0.06, g: 0.07, b: 0.1 };
const MUTED = { r: 0.35, g: 0.37, b: 0.42 };
const RULE = { r: 0.82, g: 0.84, b: 0.88 };

export function exportFileName(fullName: string, format: ExportFormat) {
  const base = fullName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}-resume.${format}` : `resume.${format}`;
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "D3D7DE", space: 4 },
    },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 21, color: "0F1219" }),
    ],
  });
}

function bullet(text: string) {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 260, hanging: 180 },
    children: [new TextRun({ text: `• ${text}`, size: 20, color: "24272E" })],
  });
}

export async function buildDocx(rewrite: ResumeRewritePayload): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: rewrite.fullName, bold: true, size: 36, color: "0F1219" })],
    }),
  ];

  if (rewrite.contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: rewrite.contactLine, size: 18, color: "596070" })],
      }),
    );
  }

  if (rewrite.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: rewrite.headline, size: 20, color: "3A3F4B" })],
      }),
    );
  }

  if (rewrite.summary) {
    children.push(sectionHeading("Summary"));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: rewrite.summary, size: 20, color: "24272E" })],
      }),
    );
  }

  if (rewrite.skillGroups.length > 0) {
    children.push(sectionHeading("Skills"));
    for (const group of rewrite.skillGroups) {
      if (group.items.length === 0) continue;
      children.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: `${group.label}: `, bold: true, size: 20, color: "0F1219" }),
            new TextRun({ text: group.items.join(", "), size: 20, color: "24272E" }),
          ],
        }),
      );
    }
  }

  if (rewrite.experience.length > 0) {
    children.push(sectionHeading("Experience"));
    for (const role of rewrite.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: role.title, bold: true, size: 21, color: "0F1219" }),
            new TextRun({ text: `  ${role.company}`, size: 20, color: "24272E" }),
            ...(role.period
              ? [new TextRun({ text: `  ${role.period}`, size: 18, color: "596070" })]
              : []),
          ],
        }),
      );
      for (const line of role.bullets) children.push(bullet(line));
    }
  }

  if (rewrite.projects.length > 0) {
    children.push(sectionHeading("Projects"));
    for (const project of rewrite.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [new TextRun({ text: project.name, bold: true, size: 21, color: "0F1219" })],
        }),
      );
      for (const line of project.bullets) children.push(bullet(line));
    }
  }

  if (rewrite.education.length > 0) {
    children.push(sectionHeading("Education"));
    for (const entry of rewrite.education) {
      children.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: entry.degree, bold: true, size: 20, color: "0F1219" }),
            new TextRun({ text: `  ${entry.institution}`, size: 20, color: "24272E" }),
            ...(entry.period
              ? [new TextRun({ text: `  ${entry.period}`, size: 18, color: "596070" })]
              : []),
          ],
        }),
      );
    }
  }

  if (rewrite.certifications.length > 0) {
    children.push(sectionHeading("Certifications"));
    for (const item of rewrite.certifications) children.push(bullet(item));
  }

  const document = new Document({
    creator: "AI CareerOS",
    title: `${rewrite.fullName} resume`,
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
}

type PdfCursor = { page: import("pdf-lib").PDFPage; y: number };

export async function buildPdf(rewrite: ResumeRewritePayload): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const width = 595.28;
  const height = 841.89;
  const margin = 46;
  const maxWidth = width - margin * 2;

  const cursor: PdfCursor = { page: pdf.addPage([width, height]), y: height - margin };

  const ensure = (needed: number) => {
    if (cursor.y - needed < margin) {
      cursor.page = pdf.addPage([width, height]);
      cursor.y = height - margin;
    }
  };

  const wrap = (text: string, font: typeof regular, size: number, limit: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > limit && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const write = (
    text: string,
    options: {
      font?: typeof regular;
      size?: number;
      color?: { r: number; g: number; b: number };
      indent?: number;
      gap?: number;
      center?: boolean;
    } = {},
  ) => {
    const font = options.font ?? regular;
    const size = options.size ?? 10;
    const color = options.color ?? INK;
    const indent = options.indent ?? 0;
    const limit = maxWidth - indent;

    for (const line of wrap(text, font, size, limit)) {
      ensure(size + 4);
      const x = options.center
        ? (width - font.widthOfTextAtSize(line, size)) / 2
        : margin + indent;
      cursor.page.drawText(line, {
        x,
        y: cursor.y - size,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
      });
      cursor.y -= size + 3;
    }
    cursor.y -= options.gap ?? 0;
  };

  const heading = (text: string) => {
    ensure(30);
    cursor.y -= 10;
    write(text.toUpperCase(), { font: bold, size: 10.5 });
    ensure(8);
    cursor.page.drawLine({
      start: { x: margin, y: cursor.y + 1 },
      end: { x: width - margin, y: cursor.y + 1 },
      thickness: 0.6,
      color: rgb(RULE.r, RULE.g, RULE.b),
    });
    cursor.y -= 8;
  };

  write(rewrite.fullName, { font: bold, size: 19, center: true, gap: 2 });
  if (rewrite.contactLine) write(rewrite.contactLine, { size: 9, color: MUTED, center: true });
  if (rewrite.headline) write(rewrite.headline, { size: 10, color: MUTED, center: true, gap: 4 });

  if (rewrite.summary) {
    heading("Summary");
    write(rewrite.summary, { size: 10 });
  }

  if (rewrite.skillGroups.length > 0) {
    heading("Skills");
    for (const group of rewrite.skillGroups) {
      if (group.items.length === 0) continue;
      write(`${group.label}: ${group.items.join(", ")}`, { size: 10 });
    }
  }

  if (rewrite.experience.length > 0) {
    heading("Experience");
    for (const role of rewrite.experience) {
      cursor.y -= 4;
      write(`${role.title} — ${role.company}${role.period ? `  (${role.period})` : ""}`, {
        font: bold,
        size: 10.5,
      });
      for (const line of role.bullets) write(`•  ${line}`, { size: 10, indent: 10 });
    }
  }

  if (rewrite.projects.length > 0) {
    heading("Projects");
    for (const project of rewrite.projects) {
      cursor.y -= 4;
      write(project.name, { font: bold, size: 10.5 });
      for (const line of project.bullets) write(`•  ${line}`, { size: 10, indent: 10 });
    }
  }

  if (rewrite.education.length > 0) {
    heading("Education");
    for (const entry of rewrite.education) {
      write(
        `${entry.degree} — ${entry.institution}${entry.period ? `  (${entry.period})` : ""}`,
        { size: 10 },
      );
    }
  }

  if (rewrite.certifications.length > 0) {
    heading("Certifications");
    for (const item of rewrite.certifications) write(`•  ${item}`, { size: 10, indent: 10 });
  }

  return Buffer.from(await pdf.save());
}
