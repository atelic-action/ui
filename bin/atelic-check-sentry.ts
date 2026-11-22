#!/usr/bin/env bun
// atelic-check-sentry: fails a production build that would ship without a Sentry DSN.
import { main } from "../src/scripts/check-sentry";

main();
