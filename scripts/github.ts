export async function githubFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Frappe-Brewery-Bot",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `https://api.github.com${endpoint}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${endpoint}`);
  }

  // Return JSON if there is content, otherwise null
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
