export const BOT_MARKER = "<!-- frappe-brewery-bot-comment -->";

export async function githubFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Frappe-Brewery-Bot",
    ...options.headers
  };
  
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `https://api.github.com${endpoint}`;
  
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${endpoint}`);
  }
  
  // Return JSON if there is content, otherwise null
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchIssueComments(repo: string, issueNumber: string) {
  const data = await githubFetch(`/repos/${repo}/issues/${issueNumber}/comments`);
  return data || [];
}

export async function postOrUpdateBotComment(repo: string, issueNumber: string, body: string) {
  const finalBody = BOT_MARKER + "\n\n" + body;

  try {
    const comments = await fetchIssueComments(repo, issueNumber);
    const existingComment = comments.find((c: any) => c.body.includes(BOT_MARKER));
    
    if (existingComment) {
      // Update existing comment
      await githubFetch(`/repos/${repo}/issues/comments/${existingComment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: finalBody })
      });
      return;
    }
  } catch (err) {
    // If we fail to fetch comments, just try to post a new one
  }

  // Create new comment
  await githubFetch(`/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: finalBody })
  });
}

export async function setIssueState(repo: string, issueNumber: string, state: "open" | "closed") {
  await githubFetch(`/repos/${repo}/issues/${issueNumber}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state })
  });
}
