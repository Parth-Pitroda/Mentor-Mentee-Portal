import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const download = request.nextUrl.searchParams.get("download");
    const backendUrl = `${API_URL}/storage/files/${encodeURIComponent(fileId)}/view${
      download ? `?download=${download}` : ""
    }`;

    // Fetch the file binary from the backend server with credentials
    const response = await fetch(backendUrl, {
      headers: {
        Cookie: `appwrite-session=${sessionCookie.value}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `File service returned error status ${response.status}` },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "application/octet-stream");
    headers.set("Content-Length", response.headers.get("Content-Length") || String(blob.size));
    headers.set("Content-Disposition", response.headers.get("Content-Disposition") || "inline");

    // Return proxy response
    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Proxy file fetch failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load document preview" },
      { status: 500 }
    );
  }
}
