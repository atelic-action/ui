#!/usr/bin/env bun
// atelic-check-access: fails a build when a private artifact has no wall.
import { main } from "../src/scripts/check-access";

await main();
