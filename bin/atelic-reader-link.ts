#!/usr/bin/env bun
// atelic-reader-link <email> [path] [--token <token>] [--qr | --no-qr]: mints a reader link and its QR.
import { main } from "../src/scripts/reader-link";

await main(process.argv.slice(2));
