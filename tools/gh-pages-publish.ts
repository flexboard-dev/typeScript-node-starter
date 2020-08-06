import { cd, exec, echo, touch, rm, mkdir, pwd, cp } from "shelljs";
import compareVersions from "compare-versions";
import gh from "git-url-parse";
import ejs from "ejs";

import readPkgUp from "read-pkg-up";
import { assert } from "console";
import temp, { DirCallback } from "tmp";
import { versions } from "process";
const packageResult = readPkgUp.sync();
assert(packageResult);
const packageName = packageResult.packageJson.name;
assert(packageName);
const version = packageResult.packageJson.version;
assert(version);
const name = packageResult.packageJson.author.name;
assert(name);
const email = packageResult.packageJson.author.email;
assert(email);
const repoUrl = packageResult.packageJson.repository.url;
assert(repoUrl);
const gitUrlParsed = gh(repoUrl);
const repository = (gitUrlParsed.source || "") + (gitUrlParsed.pathname || "");
const gitPageBaseUrl = `https://${gitUrlParsed.organization}.github.io/${gitUrlParsed.name}`;
const ghToken = process.env.GH_TOKEN;
echo("Deploying docs!!!");
const currentWorkingDir = pwd().stdout;
const callback: DirCallback = async (
  err: Error | null,
  tempPath: string,
  removeCallback: () => void) => {
  if (err instanceof Error) {
    process.exit(1);
  }
  // console.log(currentWorkingDir.toString().trim())
  cd(tempPath);
  exec("git init", { fatal: true });
  exec(`git remote add origin https://${ghToken}@${repository}`, { fatal: true });
  exec("git fetch --all --tags", { fatal: true });
  const tags = exec(`\\
      echo "[" && \\
      (git for-each-ref \\
          --format='{"tag":"%(refname:short)","date":"%(creatordate)"}' \\
          refs/tags/* | \\
          awk -vORS=, '{ print  }' | \\
          sed 's/,$/\\n/' \\
      )  && \\
      echo "]"
  `,
    {
      silent: true
      , fatal: true
    });
  const taggedVersions: Array<Record<string, string>> = JSON.parse(tags.stdout.trim());
  const sorted = taggedVersions.sort((v1, v2) => {
    return compareVersions(v1.tag, v2.tag);
  }).reverse();
  console.log(sorted);
  console.log(taggedVersions);
  console.log(tags.stdout.trim());
  const result = exec("git branch -a | grep gh-pages| wc -l", { fatal: true });
  if (result.toString().trim() === "0") {
    exec("git checkout -b gh-pages", { fatal: true });
  } else {
    exec("git checkout gh-pages", { fatal: true });
  }
  touch(".nojekyll");
  exec(`git config user.name "${name}"`, { fatal: true });
  exec(`git config user.email "${email}"`, { fatal: true });
  rm("-rf", `${tempPath}/${version}`);
  mkdir(`${tempPath}/${version}`);
  rm("-rf", `${tempPath}/latest`);
  mkdir(`${tempPath}/latest`);
  cp("-r", currentWorkingDir.trim() + "/docs/{.*,*}", `${tempPath}/${version}`);
  cp("-r", currentWorkingDir.trim() + "/docs/{.*,*}", `${tempPath}/latest`);
  const html = await ejs.renderFile(`${currentWorkingDir}/tools/index.html.ejs`, {
    name: packageName,
    tags: sorted,
    gitPageBaseUrl: gitPageBaseUrl
  });
  exec(`echo '${html}' > index.html`, { fatal: true });
  exec("git add .", { fatal: true });
  exec("git commit -m \"docs(docs): update gh-pages\"", { fatal: true });
  exec(
    "git push --force --quiet origin gh-pages"
    , { fatal: true });
  removeCallback();
};
temp.dir({keep:true}, callback);
// rm("tmp")
// mkdir("tmp")
// cd("tmp")
// cd("git init")
// exec(`git remote add origin https://${ghToken}@${repository}`);
// exec(`git fetch`);
// exec(`git checkout gh-pages`);
// exec("git add .");
// touch(".nojekyll");
// exec(`git config user.name "${name}"`);
// exec(`git config user.email "${email}"`);
// exec("git commit -m \"docs(docs): update gh-pages\"");
// exec(
//   `git push --force --quiet "https://${ghToken}@${repository}" master:gh-pages`
// );
// rm("tmp")
echo("Docs deployed!!");
