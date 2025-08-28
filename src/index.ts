export * from "./types.js";
export * from "./device.js";

import { search } from "./device.js";
search("samsung").then((devices) => {
  console.log("Search results:", devices);
});
