import { Cheerio, CheerioAPI, load } from "cheerio";
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
 * Fetch device data from GSMArena.
 * @param deviceId The ID of the device to fetch.
 * @returns A promise that resolves to the device data.
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
      returnedDevice.network.technology = extrapolateText(
        $,
        'a[data-spec="nettech"]'
      );
      returnedDevice.network.bands2G = extrapolateText(
        $,
        'td[data-spec="net2g"]'
      );
      returnedDevice.network.bands3G = extrapolateText(
        $,
        'td[data-spec="net3g"]'
      );
      returnedDevice.network.bands4G = extrapolateText(
        $,
        'td[data-spec="net4g"]'
      );
      returnedDevice.network.bands5G = extrapolateText(
        $,
        'td[data-spec="net5g"]'
      );
      returnedDevice.network.speed = extrapolateText(
        $,
        'td[data-spec="speed"]'
      );

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
      const osUpTo = osList[1].includes("up to") ? osList[1].trim() : "";
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

export async function search(query: string): Promise<DeviceSummary[]> {
  return new Promise<DeviceSummary[]>(async (resolve, reject) => {
    try {
      const deviceList: DeviceSummary[] = [];
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

      const devices = findTag($$, "div.makers > ul > li > a");
      devices.each((index, element) => {
        // id
        const deviceId = extrapolateAttrFromElement($(element), "href")?.split(
          "."
        )[0];

        // name
        const deviceNameTag = getChildOfParentFromElement(
          $$,
          $(element),
          "strong span"
        );
        const deviceName = deviceNameTag
          ? extrapolateTextFromElement(deviceNameTag)
          : "";

        const imgElement = getChildOfParentFromElement($$, $(element), "img");
        if (!imgElement) {
          reject(new Error("Image element not found"));
          return;
        }

        const titleAttr = extrapolateAttrFromElement($(imgElement), "title");
        const titleAttrSplitted = titleAttr && titleAttr.split("Features")[1]
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
            ? titleAttr.split("Features")[1]?.split(".")[1]
            : "";

        // img
        const imgAttr = extrapolateAttrFromElement($(imgElement), "src");
        const imgUrl = imgAttr ? imgAttr : "";

        // display
        const deviceDisplay = titleAttrSplitted[0]
          ? titleAttrSplitted[0].replaceAll("display", "").trim()
          : "";

        // chipset
        const deviceChipset = titleAttrSplitted[1]
          ? titleAttrSplitted[1].replaceAll("chipset", "").trim()
          : "";

        // battery
        const deviceBattery = titleAttrSplitted[2]
          ? titleAttrSplitted[2].replaceAll("battery", "").trim()
          : "";

        // storage
        const deviceStorage = titleAttrSplitted[3]
          ? titleAttrSplitted[3].replaceAll("storage", "").trim()
          : "";

        // memory
        const deviceMemory = titleAttrSplitted[4]
          ? titleAttrSplitted[4].replaceAll("RAM", "").trim()
          : "";

        // other features
        const deviceOther =
          titleAttrSplitted.length > 5 ? titleAttrSplitted.slice(5) : [];

        const deviceSpecs = {
          inchDisplay: deviceDisplay,
          chipset: deviceChipset,
          battery: deviceBattery,
          storage: deviceStorage,
          memory: deviceMemory,
          otherFeatures: deviceOther,
        } as DeviceSummarySpecs;

        if (deviceId) {
          deviceList.push({
            id: deviceId,
            name: deviceName,
            fullName: deviceFullName,
            announced: deviceAnnounced,
            img: imgUrl,
            specs: deviceSpecs,
          });
        }
      });

      resolve(deviceList);
    } catch (error) {
      reject(new Error("[SEARCH PAGE] " + error));
    }
  });
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
