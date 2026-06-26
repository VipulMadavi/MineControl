import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { AUTH_BYPASS, MOCK_SESSION } from "@/lib/auth-bypass";
import { setMaintenanceUntil } from "@/lib/aws";
import { logMaintenanceWindow } from "@/lib/discord/webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = AUTH_BYPASS ? MOCK_SESSION : await auth();
  if (!session || !session.user?.isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const hours = typeof body.hours === "number" ? body.hours : 0;

    let maintenanceUntil: string | null = null;

    if (hours > 0) {
      // Clamp between 1 and 24 hours
      const clamped = Math.min(Math.max(hours, 1), 24);
      maintenanceUntil = new Date(Date.now() + clamped * 3600_000).toISOString();
      await setMaintenanceUntil(maintenanceUntil);
    } else {
      // Clear / resume now
      await setMaintenanceUntil(null);
    }

    const username = session.user?.name || session.user?.email || "Unknown";
    logMaintenanceWindow(username, maintenanceUntil);

    return NextResponse.json({ success: true, maintenanceUntil });
  } catch (error) {
    const err = error as Error;
    console.error("[api/autostop/maintenance] Error:", err.message);
    return NextResponse.json(
      { success: false, error: "Failed to set maintenance window." },
      { status: 500 }
    );
  }
}
