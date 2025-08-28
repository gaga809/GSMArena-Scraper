export * from "./types.js";
export * from "./device.js";

import { getDevice } from "./device.js";

console.log("INIT");
getDevice("samsung_galaxy_a07-14066");
