import {
  BASE_URL,
  extrapolateAttrFromElement,
  extrapolateText,
  extrapolateTextFromElement,
  extrapolateTextNoHTML,
  extrapolateTextNoHTMLFromElement,
  fetchPage,
  findTag,
  getChildOfParent,
  getChildOfParentFromElement,
} from "./common.js";
import { Brand } from "./types.js";

export function getAllBrands(): Promise<Brand[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const $ = await fetchPage(`${BASE_URL}makers.php3`);
      const returningBrands = [] as Brand[];

      const tbodyRows = getChildOfParent(
        $,
        "div.st-text > table > tbody",
        "tr"
      );

      if (tbodyRows) {
        tbodyRows?.each((index, element) => {
          const a = getChildOfParentFromElement($, $(element), "td > a");

          if (a) {
            const href = extrapolateAttrFromElement(a, "href");
            const brandId = href ? href.split(".")[0] : undefined;

            let brandName = extrapolateTextNoHTMLFromElement(a);
            brandName = brandName ? brandName.replaceAll('"', "") : "";

            let brandDevicesTag = getChildOfParentFromElement(
              $,
              $(element),
              "span"
            );
            let brandDevicesString = brandDevicesTag
              ? extrapolateTextFromElement(brandDevicesTag)
              : "";
            const brandDevices =
              brandDevicesString.length > 0
                ? parseInt(brandDevicesString.replaceAll("devices", "").trim())
                : 0;

            if (brandId) {
              returningBrands.push({
                id: brandId,
                name: brandName,
                numberOfDevices: brandDevices,
              });
            }
          }

          resolve(returningBrands);
        });
      } else {
        throw new Error("No brands rows found");
      }
    } catch (error) {
      reject(error);
    }
  });
}
