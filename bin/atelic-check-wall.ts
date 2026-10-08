#!/usr/bin/env bun
// atelic-check-wall <host> [path ...]: probes a deployed host's access wall.
import { main } from "../src/scripts/check-wall";

await main(process.argv.slice(2));
