#!/usr/bin/env bun
// atelic-reader-link <email> [path] [--days <n>]: mints the sign in link a send carries.
import { main } from "../src/scripts/reader-link";

await main(process.argv.slice(2));
