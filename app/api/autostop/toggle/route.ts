import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { AUTH_BYPASS, MOCK_SESSION } from "@/lib/auth-bypass";
import { getAutostopState, setAutostopEnabled } from "@/lib/aws";
import { logAutostopToggled } from "@/lib/discord/webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = AUTH_BYPASS ? MOCK_SESSION : await auth();
  if (!session || !session.user?.isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const current = await getAutostopState();
    const next = !current.enabled;

    await setAutostopEnabled(next);

    const username = session.user?.name || session.user?.email || "Unknown";
    logAutostopToggled(username, next);

    return NextResponse.json({ success: true, enabled: next });
  } catch (error) {
    const err = error as Error;
    console.error("[api/autostop/toggle] Error:", err.message);
    return NextResponse.json(
      { success: false, error: "Failed to toggle auto-stop." },
      { status: 500 }
    );
  }
}
