export * from "./types.js";
export * from "./device.js";
export * from "./brand.js";
export * from "./search.js";

import { getAdvSearchOptions } from "./search.js";

getAdvSearchOptions()
  .then((options) => {
    console.log("Advanced Search Options:", options);
  })
  .catch((error) => {
    console.error("Error fetching advanced search options:", error);
  });
