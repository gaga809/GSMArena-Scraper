import { getDevice } from "./device.js";

export * from "./types.js";
export * from "./device.js";

getDevice("apple_ipad_air_13_(2025)-13704")
    .then((device) => console.log(device))
    .catch((error) => console.error(error));