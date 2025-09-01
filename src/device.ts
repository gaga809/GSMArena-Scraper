import { CheerioAPI, load } from "cheerio";
import fs from "fs";
import {
  BASE_URL,
  extrapolateAttrFromElement,
  extrapolateDate,
  extrapolateText,
  extrapolateTextNoHTML,
  loadCamera,
  fetchPage,
  findTag,
  getChildOfParentFromElement,
  getChildOfParent,
  decryptAESCBC,
  formatDecryptedData,
  extrapolateTextFromElement,
} from "./common.js";
import {
  Device,
  DeviceMemoryInternalStorageOption,
  DeviceSummary,
  DeviceSummarySpecs,
} from "./types.js";

/**
 * Fetches detailed device information from GSMArena for a given device ID.
 *
 * This function loads the device page, parses all relevant specifications (such as network, launch, body, display, platform, memory, cameras, sound, comms, features, battery, misc, and pictures),
 * and returns a fully populated `Device` object. If the device page cannot be fetched or parsed, the promise will be rejected with an error.
 *
 * @param deviceId - The unique identifier of the device to fetch (e.g., "samsung_galaxy-s24-ultra-12548").
 * @returns {Promise<Device>} A promise that resolves to a `Device` object containing all parsed device specifications.
 * @throws Will reject the promise if the device page cannot be fetched, parsed, or if required data is missing (this will only occur if valuable info is missing).
 */
export function getDevice(deviceId: string): Promise<Device> {
  return new Promise(async (resolve, reject) => {
    try {
      const $ = await fetchPage(`${BASE_URL}${deviceId}.php`);
      if (!$) {
        throw new Error(
          `Failed to fetch device data: CheerioAPI object is null or undefined`
        );
      }

      // The device returned
      const returnedDevice: Device = {} as Device;

      // ID
      returnedDevice.id = deviceId;

      // NAME
      returnedDevice.name = extrapolateText($, 'h1[data-spec="modelname"]');

      // PHOTO
      const photoMain = findTag($, 'div[class="specs-photo-main"]');
      const photo = getChildOfParentFromElement($, photoMain, "img");
      if (photo) {
        const photoUrl = extrapolateAttrFromElement(photo, "src");
        returnedDevice.photo = photoUrl ? photoUrl : "";
      }

      // NETWORK
      returnedDevice.network = {} as Device["network"];

      returnedDevice.network.technology = getAllNetworkValuesPerRow(
        $,
        "nettech"
      );

      returnedDevice.network.bands2G = getAllNetworkValuesPerRow($, "net2g");

      returnedDevice.network.bands3G = getAllNetworkValuesPerRow($, "net3g");

      returnedDevice.network.bands4G = getAllNetworkValuesPerRow($, "net4g");

      returnedDevice.network.bands5G = getAllNetworkValuesPerRow($, "net5g");

      returnedDevice.network.speed = getAllNetworkValuesPerRow($, "speed");

      // LAUNCH
      returnedDevice.launch = {} as Device["launch"];

      const yearTd = extrapolateText($, 'td[data-spec="year"]');
      returnedDevice.launch.announced = extrapolateDate(yearTd);

      const statusTd = extrapolateText($, 'td[data-spec="status"]');
      const status = statusTd.split(".")[0];
      returnedDevice.launch.status = status;

      const releaseDate = statusTd.split(".")[1];
      returnedDevice.launch.releaseDate = extrapolateDate(
        releaseDate?.replaceAll("Released", "").trim()
      );

      // BODY
      returnedDevice.body = {} as Device["body"];

      /// dimensions
      returnedDevice.body.dimensions = {} as Device["body"]["dimensions"];

      const dimensions = extrapolateText($, 'td[data-spec="dimensions"]');
      const fullMMDim = dimensions.split("(")[0].replaceAll("mm", "");
      const [heightMM, widthMM, depthMM] = fullMMDim
        .split("x")
        .map((dim) => parseFloat(dim.trim()));

      const fullInchDim = dimensions
        .split("(")[1]
        .replaceAll("in", "")
        .replaceAll(")", "")
        .trim();
      const [heightInch, widthInch, depthInch] = fullInchDim
        .split("x")
        .map((dim) => parseFloat(dim.trim()));

      returnedDevice.body.dimensions = {
        heightMM,
        widthMM,
        depthMM,
        heightInch,
        widthInch,
        depthInch,
      };

      /// weight
      returnedDevice.body.weight = {} as Device["body"]["weight"];

      const weight = extrapolateText($, 'td[data-spec="weight"]');
      const [weightG, weightOz] = weight.split("(").map((dim) => dim.trim());
      returnedDevice.body.weight = {
        weightG: parseFloat(weightG.replace("g", "").trim()),
        weightOz: parseFloat(
          weightOz.replace("oz", "").replaceAll(")", "").trim()
        ),
      };

      /// build
      const build = extrapolateText($, 'td[data-spec="build"]');
      returnedDevice.body.build = build;

      /// sim
      const sim = extrapolateText($, 'td[data-spec="sim"]');
      returnedDevice.body.sim = sim;

      /// other
      const other = extrapolateText($, 'td[data-spec="bodyother"]');
      const otherList = other
        .split("<br>")
        .map((item) => item.trim().replaceAll('"', ""))
        .filter((item) => item.length > 0);
      returnedDevice.body.other = otherList;

      /// DISPLAY
      returnedDevice.display = {} as Device["display"];

      /// type
      const type = extrapolateText($, 'td[data-spec="displaytype"]');
      returnedDevice.display.type = type;

      /// size
      returnedDevice.display.size = {} as Device["display"]["size"];
      const size =
        extrapolateTextNoHTML($, 'td[data-spec="displaysize"]') || "";

      const sizeParts = size.split(",");
      let areaInch = 0,
        areaCM = 0,
        screenToBodyRatio = "";

      if (sizeParts.length >= 2) {
        areaInch = parseFloat(sizeParts[0].replace("inches", "").trim());
        areaCM = parseFloat(sizeParts[1].replace("cm", "").trim());
      }

      if (size.includes("(")) {
        screenToBodyRatio = size.split("(")[0].replace(")", "").trim();
      }

      returnedDevice.display.size = {
        areaInch,
        areaCM,
        screenToBodyRatio,
      };

      /// resolution
      const resolution =
        extrapolateText($, 'td[data-spec="displayresolution"]') || "";

      let width = 0,
        height = 0,
        ratio = "",
        pixelDensityPPI = "";

      const resolutionParts = resolution.split(",");
      if (resolutionParts.length >= 1) {
        const [w, h] = resolutionParts[0].split("x");
        width = parseInt(w?.trim() || "0");
        height = parseInt(h?.replace("pixels", "").trim() || "0");
      }
      if (resolutionParts.length >= 2) {
        ratio = resolutionParts[1]?.split("(")[0]?.replace("ratio", "").trim();
        pixelDensityPPI = resolutionParts[1]
          ?.split("(")[1]
          ?.replace(")", "")
          .trim();
      }

      returnedDevice.display.resolution = {
        width,
        height,
        ratio,
        pixelDensityPPI,
      };

      /// protection
      const protection = extrapolateText(
        $,
        'td[data-spec="displayprotection"]'
      );
      const protectionList =
        protection
          ?.split(",")
          .filter((item) => item.trim().length > 0)
          .map((item) => item.trim()) || [];
      returnedDevice.display.protection = protectionList;

      /// other
      const otherDisplay =
        extrapolateText($, 'td[data-spec="displayother"]') || "";
      const otherDisplayList = otherDisplay
        ? otherDisplay
            .split("<br>")
            .map((item) => item.trim().replaceAll('"', ""))
            .filter((item) => item.length > 0)
        : [];

      returnedDevice.display.others = otherDisplayList;

      /// PLATFORM
      returnedDevice.platform = {} as Device["platform"];
      /// os
      returnedDevice.platform.os = {} as Device["platform"]["os"];
      const os = extrapolateText($, 'td[data-spec="os"]');
      const osList = os
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      const osName = osList[0].split(" ")[0] || osList[0];
      const osVersion = osList[0].split(" ")[1] || "";
      const osUpTo =
        osList[1].includes("up to") || osList[1].includes("upgradable")
          ? osList[1].trim()
          : "";
      let osCustomName = "";

      if (osUpTo) {
        osCustomName = osList[2] || "";
      } else {
        osCustomName = osList[1] || "";
      }

      returnedDevice.platform.os = {
        name: osName,
        version: osVersion,
        upTo: osUpTo,
        customName: osCustomName,
      };

      /// chipset
      const chipset = extrapolateText($, 'td[data-spec="chipset"]');

      returnedDevice.platform.chipset = chipset;

      /// cpu
      const cpu = extrapolateText($, 'td[data-spec="cpu"]');
      returnedDevice.platform.cpu = cpu;

      /// gpu
      const gpu = extrapolateText($, 'td[data-spec="gpu"]');
      returnedDevice.platform.gpu = gpu;

      // MEMORY
      returnedDevice.memory = {} as Device["memory"];
      /// cardslot
      const cardSlot = extrapolateText($, 'td[data-spec="memoryslot"]');
      returnedDevice.memory.cardSlot = cardSlot;

      /// internal
      returnedDevice.memory.internal = {} as Device["memory"]["internal"];

      //// storage options
      returnedDevice.memory.internal.storageOptions =
        {} as Device["memory"]["internal"]["storageOptions"];

      const internalStorage = extrapolateText(
        $,
        'td[data-spec="internalmemory"]'
      );
      const storageOptions = [] as DeviceMemoryInternalStorageOption[];
      internalStorage.split(",").map((item) => {
        const [storage, ram] = item.trim().split(" ");
        storageOptions.push({
          storage: storage.trim(),
          memory: ram.trim(),
        } as DeviceMemoryInternalStorageOption);
      });
      returnedDevice.memory.internal.storageOptions = storageOptions;

      /// memory
      const memoryOther = extrapolateText($, 'td[data-spec="memoryother"]');
      returnedDevice.memory.internal.other = memoryOther;

      // MAIN CAMERA
      returnedDevice.mainCamera = loadCamera($, 1);

      // SELFIE CAMERA
      returnedDevice.selfieCamera = loadCamera($, 2);

      // SOUND
      returnedDevice.sound = {} as Device["sound"];

      // Loudspeaker
      const loudSpeaker = $('a[href*="loudspeaker"]')
        .closest("td.ttl")
        .next("td.nfo")
        .text()
        .trim();
      returnedDevice.sound.loudSpeaker = loudSpeaker;

      // 3.5mm jack
      const jack = $('a[href*="audio-jack"]')
        .closest("td.ttl")
        .next("td.nfo")
        .text()
        .trim();

      returnedDevice.sound.jack = jack;

      // COMMS
      returnedDevice.comms = {} as Device["comms"];
      const wlan = extrapolateText($, 'td[data-spec="wlan"]');
      returnedDevice.comms.wlan = wlan
        ? wlan.split(",").map((w) => w.trim())
        : [];

      const bluetooth = extrapolateText($, 'td[data-spec="bluetooth"]');
      returnedDevice.comms.bluetooth = bluetooth
        ? bluetooth.split(",").map((b) => b.trim())
        : [];

      const gps = extrapolateText($, 'td[data-spec="gps"]');
      returnedDevice.comms.gps = gps ? gps.split(",").map((g) => g.trim()) : [];

      const nfc = extrapolateText($, 'td[data-spec="nfc"]');
      returnedDevice.comms.nfc = nfc;

      const infrared = extrapolateText($, 'td[data-spec="infrared"]');
      returnedDevice.comms.infrared = infrared;

      const radio = extrapolateText($, 'td[data-spec="radio"]');
      returnedDevice.comms.radio = radio;

      const usb = extrapolateText($, 'td[data-spec="usb"]');
      returnedDevice.comms.usb = usb ? usb.split(",").map((u) => u.trim()) : [];

      // FEATURES
      returnedDevice.features = {} as Device["features"];

      /// sensors
      const sensors = extrapolateText($, 'td[data-spec="sensors"]');
      returnedDevice.features.sensors = sensors
        ? sensors.split(",").map((f) => f.trim())
        : [];

      /// other
      const otherFeatures = extrapolateText($, 'td[data-spec="featuresother"]');
      returnedDevice.features.other = otherFeatures
        ? otherFeatures.split(",").map((f) => f.trim())
        : [];

      // BATTERY
      returnedDevice.battery = {} as Device["battery"];

      /// type
      const batteryType = extrapolateText($, 'td[data-spec="batdescription1"]');
      returnedDevice.battery.type = batteryType;

      /// charging
      const batteryCharging = $('a[href*="battery-charging"]')
        .closest("td.ttl")
        .next("td.nfo")
        .text()
        .trim();
      const batteryChargingList = batteryCharging
        ? batteryCharging
            .split("<br>")
            .map((item) => item.trim().replaceAll('"', ""))
            .filter((item) => item.length > 0)
        : [];

      returnedDevice.battery.charging = batteryChargingList;

      // MISC
      returnedDevice.misc = {} as Device["misc"];

      /// colors
      const colors = extrapolateText($, 'td[data-spec="colors"]');
      const colorsList = colors ? colors.split(",").map((c) => c.trim()) : [];
      returnedDevice.misc.colors = colorsList;

      /// models
      const models = extrapolateText($, 'td[data-spec="models"]');
      const modelsList = models ? models.split(",").map((m) => m.trim()) : [];
      returnedDevice.misc.models = modelsList;

      /// price
      const price = extrapolateText($, 'td[data-spec="price"]');
      returnedDevice.misc.price = price ? price : "";

      /// sar
      returnedDevice.misc.sar = {} as Device["misc"]["sar"];

      //// sar eu
      const sarEu = extrapolateText($, 'td[data-spec="sar-eu"]');
      const sarEuList = sarEu
        ? sarEu
            .replaceAll("(head)", ",")
            .replaceAll("(body)", "")
            .replaceAll("&nbsp", "")
            .split(",")
            .map((s) => s.trim())
        : [];

      const sarUs = extrapolateText($, 'td[data-spec="sar-us"]');
      const sarUsList = sarUs
        ? sarUs
            .replaceAll("(head)", ",")
            .replaceAll("(body)", "")
            .replaceAll("&nbsp", "")
            .split(",")
            .map((s) => s.trim())
        : [];

      returnedDevice.misc.sar =
        sarEuList && sarUsList
          ? {
              eu: sarEuList
                ? {
                    head: sarEuList[0],
                    body: sarEuList[1],
                  }
                : null,
              other: sarUsList
                ? {
                    head: sarUsList[0],
                    body: sarUsList[1],
                  }
                : null,
            }
          : null;

      // PICTURES
      const deviceIdSplitted = deviceId.split("-");
      const picturesUrl = `${BASE_URL}${deviceIdSplitted[0]}-pictures-${deviceIdSplitted[1]}.php`;
      const pictures = [] as string[];
      const $$ = await fetchPage(picturesUrl);

      const picturesList = getChildOfParent($$, "div#pictures-list", "img");
      if (picturesList && picturesList.length > 0) {
        picturesList.each((index, element) => {
          const imgUrl = extrapolateAttrFromElement($(element), "src");
          if (imgUrl) {
            pictures.push(imgUrl);
          }
        });
      }
      returnedDevice.pictures = pictures;

      resolve(returnedDevice);
    } catch (error) {
      reject(new Error("[FETCH PAGE] " + error));
    }
  });
}

/**
 * Searches for devices on GSMArena matching the given query string.
 *
 * This function performs a search using the provided query, decrypts the resulting data,
 * parses the device summaries, and returns a list of matching devices.
 *
 * @param query - The search query string (e.g., "iPhone 15").
 * @returns {Promise<DeviceSummary[]>} A promise that resolves to an array of `DeviceSummary` objects representing the search results.
 * @throws Will reject the promise if the search page cannot be fetched, decryption parameters are missing, or parsing fails.
 */
export async function search(query: string): Promise<DeviceSummary[]> {
  return new Promise<DeviceSummary[]>(async (resolve, reject) => {
    try {
      const searchUrl = `${BASE_URL}res.php3?sSearch=${encodeURIComponent(
        query
      )}`;
      const $ = await fetchPage(searchUrl);

      // Get decrypt parameters
      const { iv, key, data } = getDecryptParameters($);

      if (!key || !iv || !data) {
        throw new Error("Missing decryption parameters");
      }
      const decryptedData = await decryptAESCBC(key, iv, data);
      const formattedData = formatDecryptedData(decryptedData);
      const $$ = load(formattedData);

      const deviceList = readDevicesFromHtml($$);

      resolve(deviceList);
    } catch (error) {
      reject(new Error("[SEARCH PAGE] " + error));
    }
  });
}

/**
 * Performs a full search for devices on GSMArena using the given query string.
 *
 * This function executes a comprehensive search and is intended to retrieve all possible matches for the query.
 * The results are written to a local file ("search.html") for debugging or inspection purposes.
 *
 * @param query - The search query string (e.g., "Galaxy S").
 * @returns {Promise<DeviceSummary[]>} A promise that resolves to an array of `DeviceSummary` objects representing the search results.
 * @throws Will reject the promise if the search page cannot be fetched or parsing fails.
 */
export async function fullSearch(query: string): Promise<DeviceSummary[]> {
  return new Promise<DeviceSummary[]>(async (resolve, reject) => {
    try {
      const deviceList: DeviceSummary[] = [];
      const searchUrl = `${BASE_URL}results.php3?sQuickSearch=yes&sName=${encodeURIComponent(
        query
      )}`;
      const $ = await fetchPage(searchUrl);

      fs.writeFileSync("search.html", $.html());

      resolve(deviceList);
    } catch (error) {
      reject(new Error("[SEARCH PAGE] " + error));
    }
  });
}

/**
 * Retrieves all devices for a specific brand from GSMArena.
 *
 * This function fetches all device summaries for the given brand, handling pagination if necessary.
 *
 * @param brandId - The unique identifier of the brand (e.g., "samsung-phones-9").
 * @returns {Promise<DeviceSummary[]>} A promise that resolves to an array of `DeviceSummary` objects for the brand.
 * @throws Will reject the promise if any page cannot be fetched or parsing fails.
 */
export function getAllDevicesOfBrand(
  brandId: string
): Promise<DeviceSummary[]> {
  return new Promise(async (resolve, reject) => {
    try {
      let url = `${BASE_URL}${brandId}.php`;
      const $ = await fetchPage(url);
      const deviceList = readDevicesFromHtml($);

      let nextPageId = 2;
      let shortBrandId = brandId.split("-").slice(0, 2).join("-");
      let brandIdNumber = brandId.split("-")[2];

      let newDevices;
      do {
        const url = `${BASE_URL}${shortBrandId}-f-${brandIdNumber}-0-p${nextPageId}.php`;

        const $$ = await fetchPage(url);
        newDevices = readDevicesFromHtml($$);

        if (newDevices.length > 0) {
          deviceList.push(...newDevices);
          nextPageId++;
        }
      } while (newDevices.length > 0);

      resolve(deviceList);
    } catch (error) {
      reject(error);
    }
  });
}

function readDevicesFromHtml($: CheerioAPI): DeviceSummary[] {
  const deviceList: DeviceSummary[] = [];
  const devices = findTag($, "div.makers > ul > li > a");
  devices.each((index, element) => {
    // id
    const deviceId = extrapolateAttrFromElement($(element), "href")?.split(
      "."
    )[0];

    // name
    const deviceNameTag = getChildOfParentFromElement(
      $,
      $(element),
      "strong span"
    );
    const deviceName = deviceNameTag
      ? extrapolateTextFromElement(deviceNameTag)
      : "";

    const imgElement = getChildOfParentFromElement($, $(element), "img");
    if (!imgElement) {
      throw new Error("Image element not found");
    }

    const titleAttr = extrapolateAttrFromElement($(imgElement), "title");

    const titleAttrSplitted =
      titleAttr && titleAttr.split("Features")[1]
        ? titleAttr.split("Features")[1].split(",")
        : [];

    // fullname
    const deviceFullName =
      titleAttr && titleAttr.split("Features")[0]
        ? titleAttr.split("Features")[0]?.split(".")[0]
          ? titleAttr.split("Features")[0]?.split(".")[0]
          : titleAttr || ""
        : titleAttr || "";

    // announced
    const deviceAnnounced =
      titleAttr && titleAttr.split("Features")[1]
        ? titleAttr.split("Features")[0]?.split(".")[1]
        : "";

    // img
    const imgAttr = extrapolateAttrFromElement($(imgElement), "src");
    const imgUrl = imgAttr ? imgAttr : "";

    // url
    const deviceUrlAttr = extrapolateAttrFromElement($(element), "href");
    const deviceUrl = deviceUrlAttr ? `${BASE_URL}${deviceUrlAttr}` : "";

    let fieldsIndex = 0;
    // display
    const deviceDisplay =
      titleAttrSplitted[fieldsIndex] &&
      titleAttrSplitted[fieldsIndex].includes("display")
        ? titleAttrSplitted[fieldsIndex].replaceAll("display", "").trim()
        : "";

    if (deviceDisplay) fieldsIndex++;

    // chipset
    const deviceChipset =
      titleAttrSplitted[fieldsIndex] &&
      titleAttrSplitted[fieldsIndex].includes("chipset")
        ? titleAttrSplitted[fieldsIndex].replaceAll("chipset", "").trim()
        : "";

    if (deviceChipset) fieldsIndex++;

    // primary camera
    const devicePrimaryCamera =
      titleAttrSplitted[fieldsIndex] &&
      titleAttrSplitted[fieldsIndex].includes("primary camera")
        ? titleAttrSplitted[fieldsIndex].replaceAll("primary camera", "").trim()
        : "";

    if (devicePrimaryCamera) {
      fieldsIndex++;
    }

    // selfieCamera
    const deviceSelfieCamera =
      titleAttrSplitted[fieldsIndex] &&
      titleAttrSplitted[fieldsIndex].includes("front camera")
        ? titleAttrSplitted[fieldsIndex].replaceAll("front camera", "").trim()
        : "";

    if (deviceSelfieCamera) {
      fieldsIndex++;
    }

    // battery

    const deviceBattery =
      titleAttrSplitted[fieldsIndex] &&
      titleAttrSplitted[fieldsIndex].includes("battery")
        ? titleAttrSplitted[fieldsIndex]
            .replaceAll("battery", "")
            .replaceAll(".", "")
            .trim()
        : "";

    if (deviceBattery) {
      fieldsIndex++;
    }

    // storage
    const deviceStorage =
      titleAttrSplitted[fieldsIndex] &&
      titleAttrSplitted[fieldsIndex].includes("storage")
        ? titleAttrSplitted[fieldsIndex].replaceAll("storage", "").trim()
        : "";

    if (deviceStorage) {
      fieldsIndex++;
    }

    // memory
    const deviceMemory =
      titleAttrSplitted[fieldsIndex] &&
      titleAttrSplitted[fieldsIndex].includes("RAM")
        ? titleAttrSplitted[fieldsIndex].replaceAll("RAM", "").trim()
        : "";

    if (deviceMemory) {
      fieldsIndex++;
    }

    // other features
    const deviceOther =
      titleAttrSplitted.length > fieldsIndex
        ? titleAttrSplitted.slice(fieldsIndex)
        : [];

    const deviceSpecs = {
      inchDisplay: deviceDisplay,
      chipset: deviceChipset,
      primaryCamera: devicePrimaryCamera,
      selfieCamera: deviceSelfieCamera,
      battery: deviceBattery,
      storage: deviceStorage,
      memory: deviceMemory,
      otherFeatures: deviceOther,
    } as DeviceSummarySpecs;

    if (deviceId) {
      deviceList.push({
        id: deviceId,
        url: deviceUrl,
        name: deviceName,
        fullName: deviceFullName,
        announced: deviceAnnounced,
        img: imgUrl,
        specs: deviceSpecs,
      });
    }
  });

  return deviceList;
}

function getDecryptParameters($: CheerioAPI): {
  iv: string | null;
  key: string | null;
  data: string | null;
} {
  // Find the script tag containing the decryption constants
  const scriptTag = $("script")
    .filter((_, el) => {
      const content = $(el).html() || "";
      return (
        content.includes("const KEY") &&
        content.includes("const IV") &&
        content.includes("const DATA")
      );
    })
    .first();

  const scriptContent = scriptTag.html() || "";

  let iv: string | null = null,
    key: string | null = null,
    data: string | null = null;

  const ivMatch = scriptContent.match(/const IV\s*=\s*"([^"]+)";/);
  const keyMatch = scriptContent.match(/const KEY\s*=\s*"([^"]+)";/);
  const dataMatch = scriptContent.match(/const DATA\s*=\s*"([^"]+)";/);

  if (ivMatch) iv = ivMatch[1];
  if (keyMatch) key = keyMatch[1];
  if (dataMatch) data = dataMatch[1];

  return { iv, key, data };
}

function getAllNetworkValuesPerRow(
  document: CheerioAPI,
  currentDataSpec: string
): string {
  const returningList = [];
  let nextTag: any = findTag(document, `td[data-spec="${currentDataSpec}"]`);
  if (nextTag) {
    const primaryTagText = extrapolateTextFromElement(nextTag);
    primaryTagText.length > 0 ? returningList.push(primaryTagText) : null;

    const nextTr = nextTag.closest("tr").next();
    nextTag = getChildOfParentFromElement(document, nextTr, "td.nfo");

    do {
      if (
        nextTag &&
        (!extrapolateAttrFromElement(nextTag, "data-spec") ||
          extrapolateAttrFromElement(nextTag, "data-spec") === "")
      ) {
        const text = extrapolateTextFromElement(nextTag);
        text.length > 0 ? returningList.push(text) : null;

        const nextTrInner = nextTag.closest("tr").next();
        nextTag = getChildOfParentFromElement(document, nextTrInner, "td.nfo");
      } else {
        break;
      }
    } while (
      nextTag &&
      (!extrapolateAttrFromElement(nextTag, "data-spec") ||
        extrapolateAttrFromElement(nextTag, "data-spec") === "")
    );
  }

  console.log(returningList);
  return returningList.join("\n");
}
