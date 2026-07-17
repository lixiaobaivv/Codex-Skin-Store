import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function findSubmissionUrl(body) {
  const matches = [...body.matchAll(/https:\/\/github\.com\/user-attachments\/files\/\d+\/codex-skin-submission-[A-Za-z0-9._-]+\.zip/g)].map((match) => match[0]);
  if (matches.length !== 1) throw new Error(`投稿 Issue 必须且只能包含一个标准 ZIP 附件（找到 ${matches.length} 个）`);
  return matches[0];
}

export async function downloadIssueSubmission({ repository, issueNumber, output, token = process.env.GITHUB_TOKEN }) {
  if (!/^\d+$/.test(String(issueNumber))) throw new Error("issue_number 必须是正整数");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error("仓库名称格式不正确");
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "Codex-Skin-Store-reviewer" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const issueResponse = await fetch(`https://api.github.com/repos/${repository}/issues/${issueNumber}`, { headers });
  if (!issueResponse.ok) throw new Error(`读取 Issue 失败：HTTP ${issueResponse.status}`);
  const issue = await issueResponse.json();
  if (issue.pull_request) throw new Error("目标编号是 Pull Request，不是主题投稿 Issue");
  const url = findSubmissionUrl(issue.body ?? "");
  const archiveResponse = await fetch(url, { headers, redirect: "follow" });
  if (!archiveResponse.ok) throw new Error(`下载投稿附件失败：HTTP ${archiveResponse.status}`);
  const bytes = new Uint8Array(await archiveResponse.arrayBuffer());
  if (bytes.length > 24 * 1024 * 1024) throw new Error("投稿 ZIP 不能超过 24 MB");
  await writeFile(output, bytes);
  return { issueUrl: issue.html_url, title: issue.title, attachmentUrl: url, size: bytes.length };
}

async function main() {
  const value = (name) => process.argv[process.argv.indexOf(name) + 1];
  const repository = value("--repo");
  const issueNumber = value("--issue");
  const output = value("--output");
  if (!repository || !issueNumber || !output) throw new Error("用法：node tools/download-theme-submission.mjs --repo owner/name --issue 123 --output submission.zip");
  const result = await downloadIssueSubmission({ repository, issueNumber, output });
  console.log(`已下载 ${result.issueUrl} 的投稿包（${result.size} bytes）`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
