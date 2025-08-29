import { getAllDevicesOfBrand } from "./device.js";

export * from "./types.js";
export * from "./device.js";
export * from "./brand.js";

getAllDevicesOfBrand("ulefone-phones-124")
  .then((devices) =>
    console.log("DEVICES: ", devices, "NUMBER: ", devices.length)
  )
  .catch((error) => console.error(error));
