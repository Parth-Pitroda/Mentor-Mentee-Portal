import { NextRequest, NextResponse } from "next/server";
import HTMLtoDOCX from "html-to-docx";

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json();
    if (!html) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    // Convert HTML to DOCX buffer
    const fileBuffer = await HTMLtoDOCX(html, null, {
      orientation: "portrait",
      margins: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename || "report"}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("DOCX generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate DOCX" }, { status: 500 });
  }
}
