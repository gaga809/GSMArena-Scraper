import { CheerioAPI } from "cheerio";
import {
  fetchPage,
  BASE_URL,
  findTag,
  getChildOfParentFromElement,
  extrapolateAttrFromElement,
  extrapolateTextFromElement,
} from "./common.js";
import {
  AdvancedSearchOptions,
  BaseOption,
  MultiSelectOption,
  SelectOption,
  SelectOptionDivided,
} from "./types.js";

export async function getAdvSearchOptions(): Promise<AdvancedSearchOptions[]> {
  return new Promise(async (resolve, reject) => {
    let advOptions: AdvancedSearchOptions[] = [];
    let $ = await fetchPage(`${BASE_URL}search.php3`);

    // MULTI SELECT
    let mutipleSelectsTags = findTag($, "select.phonefinder-select[multiple]");

    Array.from(mutipleSelectsTags).forEach((element) => {
      const labelElement = $(element).prev("label");
      const label =
        labelElement && labelElement.length > 0
          ? extrapolateTextFromElement(labelElement).replaceAll(":", "")
          : "";
      const multipleCategory = {
        name: label,
        type: "multi-select",
        values: [] as BaseOption[],
      } as MultiSelectOption;

      let options = getChildOfParentFromElement($(element), "option");

      if (options) {
        Array.from(options).forEach((option) => {
          let value = extrapolateAttrFromElement($(option), "value");
          let text = extrapolateTextFromElement($(option));
          if (value && text) {
            multipleCategory.values.push({
              name: value,
              label: text,
            } as BaseOption);
          }
        });
      }
      advOptions.push(multipleCategory);
    });

    // SINGLE SELECT
    let singleSelectsTags = findTag(
      $,
      "select.phonefinder-select:not([multiple])"
    );

    Array.from(singleSelectsTags).forEach((element) => {
      const labelElement = $(element).prev("label");
      const label =
        labelElement && labelElement.length > 0
          ? extrapolateTextFromElement(labelElement).replaceAll(":", "")
          : "";

      let singleCategory: SelectOption | SelectOptionDivided;

      if (label === "Min OS Version") {
        singleCategory = {
          name: label,
          type: "select-divided",
          values: {} as { [key: string]: BaseOption[] },
        } as SelectOptionDivided;

        const options = getOsVersionNames($);
        Object.keys(options).forEach((key: string) => {
          const values: BaseOption[] = [];
          options[key].forEach((value: string, index: number) => {
            values.push({
              name: options[key][index][1],
              label: options[key][index][0],
            } as BaseOption);
          });
          (singleCategory as SelectOptionDivided).values[key] = values;
        });
      } else {
        singleCategory = {
          name: label,
          type: "select",
          values: [] as BaseOption[],
        } as SelectOption;

        const options = getChildOfParentFromElement($(element), "option");

        if (options) {
          Array.from(options).forEach((option) => {
            let value = extrapolateAttrFromElement($(option), "value");
            let text = extrapolateTextFromElement($(option));

            if (value && text && Array.isArray(singleCategory.values)) {
              singleCategory.values.push({
                name: value,
                label: text,
              } as BaseOption);
            }
          });
        }
      }

      advOptions.push(singleCategory);
    });

    // RANGE
    let rangesTags = findTag($, "div.phonefinder-slider");

    Array.from(rangesTags).forEach((element) => {
      let label = extrapolateTextFromElement($(element).prev("label"));
      let minValue = 0;
      let maxValue = 100000;

      advOptions.push({
        name: label,
        type: "range",
        min: minValue,
        max: maxValue,
      });
    });

    // CHECKBOX
    let checkboxesTags = findTag($, "input[type='checkbox']");

    Array.from(checkboxesTags).forEach((element) => {
      let label = extrapolateTextFromElement($(element).prev("label"));

      advOptions.push({
        name: label,
        type: "checkbox",
        selected: extrapolateAttrFromElement($(element), "checked") === "true",
      });
    });

    resolve(advOptions);
  });
}

export function getOsVersionNames($: CheerioAPI): any {
  // prendi il contenuto di tutti gli <script>
  const scriptContent = $("script")
    .map((_, el) => $(el).html())
    .get()
    .find((content) => content && content.includes("var osVersionNames"));

  if (!scriptContent) return null;

  const match = scriptContent.match(/var\s+osVersionNames\s*=\s*({[\s\S]*?});/);
  if (!match) return null;

  const osVersionNames = Function(`"use strict"; return (${match[1]});`)();

  return osVersionNames;
}
