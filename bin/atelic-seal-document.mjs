#!/usr/bin/env node
// atelic-seal-document <config.json> [out.json]: seals a document for its readers.
import { argv } from "node:process";
import { cli } from "../src/scripts/build-gate-payload.mjs";

await cli(argv.slice(2));
