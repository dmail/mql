/*
 * Start a server serving files into dist/
 * Read more in https://github.com/jsenv/core
 */

import { startBuildServer } from "@jsenv/core";
import open from "open";

const buildServer = await startBuildServer({
  buildDirectoryUrl: new URL("../dist/", import.meta.url),
  port: 3501,
});
if (process.argv.includes("--open")) {
  open(buildServer.origin);
}
