// Background function: may run for up to 15 minutes. Started by /api/admin/analyse.
import { getStore } from "@netlify/blobs";
import { runAnalysis } from "../lib/analyse.mjs";

export default async (req) => {
  const p = process.env.ADMIN_PASSWORD;
  if (!p || req.headers.get("x-admin-key") !== p) return;
  const meta = getStore("meta");
  try {
    const an = await runAnalysis();
    await meta.setJSON("analysis", an);
    await meta.setJSON("job", { state: "done", ts: Date.now() });
  } catch (e) {
    await meta.setJSON("job", { state: "error", error: String(e.message || e).slice(0, 300), ts: Date.now() });
  }
};
