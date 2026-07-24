import {loadEnvConfig} from "@next/env";
import {runWordPressBlogMigration} from "./lib/wordpress-blog-migration";

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function main() {
  loadEnvConfig(process.cwd());

  const dryRun = hasFlag("--dry-run");
  const projectId =
    process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const dataset =
    process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "";
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-07-17";

  console.log("WordPress -> Sanity Thrive Weekly migration");
  console.log(`Dry run: ${dryRun ? "yes" : "no"}`);
  console.log(`Sanity project: ${projectId || "(not set)"}`);
  console.log(`Sanity dataset: ${dataset || "(not set)"}`);

  if (!dryRun && (!projectId || !dataset || !writeToken)) {
    console.log(
      "Write configuration is incomplete. Run the dry-run first or configure NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN before importing.",
    );
    process.exitCode = 1;
    return;
  }

  const result = await runWordPressBlogMigration({
    dryRun,
    projectId,
    dataset,
    apiVersion,
    writeToken,
  });

  console.log(
    JSON.stringify(
      {
        totalWordpressPostsInspected: result.importReport.totalWordpressPostsInspected,
        thriveWeeklyPostsSelected: result.importReport.thriveWeeklyPostsSelected,
        postsPrepared: result.importReport.postsPrepared,
        postsImported: result.importReport.postsImported,
        imageAlignmentCounts: result.importReport.imagePresentationSummary?.alignmentCounts,
        imageSizeCounts: result.importReport.imagePresentationSummary?.sizeCounts,
        writeClientConfigured: result.writeClientConfigured,
        reportDirectory: "migration/blog",
      },
      null,
      2,
    ),
  );

  if (!result.writeClientConfigured) {
    console.log(
      "Real import is ready to run after configuring NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and SANITY_API_WRITE_TOKEN.",
    );
    console.log("Command: npm run migrate:wordpress-blog");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
