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

/**
 * Fetches and parses the list of all brands from the GSMArena website.
 *
 * This function retrieves the brands page, extracts each brand's ID, name, and the number of devices associated with it,
 * and returns an array of `Brand` objects. If the page structure is not as expected or an error occurs during fetching or parsing,
 * the promise will be rejected with an error.
 *
 * @returns {Promise<Brand[]>} A promise that resolves to an array of `Brand` objects containing brand information.
 * @throws Will reject the promise if the brands table rows cannot be found or if any error occurs during the process.
 */
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
