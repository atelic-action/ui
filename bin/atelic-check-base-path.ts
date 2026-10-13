#!/usr/bin/env bun
// atelic-check-base-path: fails a build whose pages or vercel.json disagree with the base path.
import { main } from "../src/scripts/check-base-path";

await main();
