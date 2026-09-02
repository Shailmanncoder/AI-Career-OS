import { describe, expect, it } from "vitest";
import { assembleLines } from "@/lib/services/resume-extract";
import { exportFileName } from "@/lib/services/resume-export";

const item = (str: string, x: number, y: number, width = str.length * 5) => ({
  str,
  transform: [1, 0, 0, 1, x, y],
  width,
});

describe("assembleLines", () => {
  it("keeps items on the same baseline as one line", () => {
    expect(assembleLines([item("Backend", 40, 700, 40), item("Engineer", 84, 700, 44)])).toBe(
      "Backend Engineer",
    );
  });

  it("separates items on different baselines into different lines", () => {
    const text = assembleLines([item("First line", 40, 700), item("Second line", 40, 680)]);
    expect(text.split("\n")).toEqual(["First line", "Second line"]);
  });

  it("orders lines top to bottom regardless of input order", () => {
    const text = assembleLines([item("Bottom", 40, 100), item("Top", 40, 700), item("Middle", 40, 400)]);
    expect(text.split("\n")).toEqual(["Top", "Middle", "Bottom"]);
  });

  it("orders items left to right within a line", () => {
    expect(assembleLines([item("world", 100, 700, 30), item("hello", 40, 700, 30)])).toBe(
      "hello world",
    );
  });

  it("tolerates tiny baseline jitter within a line", () => {
    expect(assembleLines([item("same", 40, 700, 24), item("line", 68, 701.5, 24)])).toBe("same line");
  });

  it("preserves bullet characters so structure survives extraction", () => {
    const text = assembleLines([
      item("• Built the pipeline", 50, 700),
      item("• Cut latency by 40 percent", 50, 680),
    ]);
    expect(text.split("\n").every((line) => line.startsWith("•"))).toBe(true);
  });

  it("returns an empty string for a page with no text", () => {
    expect(assembleLines([])).toBe("");
    expect(assembleLines([{ str: "" }])).toBe("");
  });

  it("survives items missing a transform", () => {
    expect(assembleLines([{ str: "orphan" }])).toBe("orphan");
  });

  it("does not insert a space between adjacent glyph runs", () => {
    expect(assembleLines([item("Post", 40, 700, 20), item("greSQL", 60, 700, 30)])).toBe("PostgreSQL");
  });
});

describe("exportFileName", () => {
  it("builds a slugged filename per format", () => {
    expect(exportFileName("Ravi Kulkarni", "docx")).toBe("ravi-kulkarni-resume.docx");
    expect(exportFileName("Ravi Kulkarni", "pdf")).toBe("ravi-kulkarni-resume.pdf");
  });

  it("strips punctuation and collapses separators", () => {
    expect(exportFileName("  Dr. Aarav   Mehta-Singh ", "pdf")).toBe("dr-aarav-mehta-singh-resume.pdf");
  });

  it("falls back when the name yields nothing usable", () => {
    expect(exportFileName("!!!", "docx")).toBe("resume.docx");
    expect(exportFileName("", "pdf")).toBe("resume.pdf");
  });
});
