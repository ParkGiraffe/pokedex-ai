import { spawn } from "node:child_process";

const scripts = [
  "fetch:types",
  "fetch:pokedex",
  "fetch:moves",
  "fetch:abilities",
  "fetch:items",
  "fetch:natures",
];

const run = (name: string) =>
  new Promise<void>((resolveScript, rejectScript) => {
    process.stderr.write(`\n=== ${name} ===\n`);
    const child = spawn("pnpm", ["run", name], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolveScript();
      else rejectScript(new Error(`${name} 실패 (exit ${code})`));
    });
  });

const main = async () => {
  for (const s of scripts) await run(s);
  process.stderr.write("\n=== 모든 fetcher 완료 ===\n");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
