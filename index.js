export const config = {
  runtime: "edge",
};

const ALLOWED = [
  { owner: "pr3y", repo: "Bruce" },
  { owner: "bmorcelli", repo: "Launcher" },
];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repository");
  const tag = searchParams.get("tag");
  const filename = searchParams.get("filename");

  if (!owner || !repo || !tag || !filename) {
    return new Response(
      JSON.stringify({ error: "Missing required parameters" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Check against whitelist
  const allowed = ALLOWED.some(
    (item) => item.owner === owner && item.repo === repo
  );
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "This repository is not allowed" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const targetUrl = `https://github.com/${owner}/${repo}/releases/download/${tag}/${filename}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Upstream fetch failed" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await response.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Content-Type":
          response.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch target" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
