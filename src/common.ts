import * as cheerio from "cheerio";
import { AnyNode } from "domhandler";
import { DeviceCamera, DeviceCameraSpecs } from "./types.js";

export const BASE_URL = "https://www.gsmarena.com/";
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.188 Safari/537.36";

let CAN_FETCH = true;

export async function handleRateLimit(waitTime: number) {
    CAN_FETCH = false;
    console.warn(`Rate limited! Waiting for ${waitTime / 1000} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    CAN_FETCH = true;
    console.log("Resuming requests...");
}

export async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
    return new Promise<cheerio.CheerioAPI>((resolve, reject) => {
        if (!CAN_FETCH) {
            return reject(
                new Error(
                    "Currently rate limited. Please wait before retrying."
                )
            );
        }
        handleRateLimit(500).then(() => {
            performFetch(url)
                .then((body) => {
                    const $ = cheerio.load(body);
                    resolve($);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    });
}

function performFetch(url: string): Promise<string> {
    return fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "Upgrade-Insecure-Requests": "1",
        },
    }).then((response) => middlewareFetch(response));
}

function middlewareFetch(response: Response) {
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error(
                `Access forbidden! You might be blocked by the server. status: ${response.status} ${response.statusText}`
            );
        } else if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            let responseMessage = `Too many requests! You are being rate limited. status: ${response.status} ${response.statusText}. Need to wait for `;
            let waitTime;

            if (!retryAfter) {
                responseMessage += "a few seconds.";
            } else {
                if (/^\d+$/.test(retryAfter)) {
                    waitTime = parseInt(retryAfter, 10) * 1000;
                } else {
                    const retryDate = new Date(retryAfter);
                    waitTime = retryDate.getTime() - Date.now();
                }
                responseMessage += `${Math.ceil(waitTime / 1000)} seconds.`;
            }
            throw new Error(responseMessage);
        }
        throw new Error(
            `HTTP error! status: ${response.status} ${response.statusText}`
        );
    }
    return response.text();
}

/// CHEERIO
export function findTag(document: cheerio.CheerioAPI, query: string) {
    return document(query);
}

export function extrapolateText(document: cheerio.CheerioAPI, query: string) {
    const element = findTag(document, query);
    return element.length > 0 ? element.text().trim() : "";
}

export function extrapolateTextNoHTML(document: cheerio.CheerioAPI, query: string) {
    const element = findTag(document, query);
    if (element.length > 0) {
        return element.clone().children().remove().end().text().trim();
    }
    return "";
}

export function extrapolateAttr(document: cheerio.CheerioAPI, query: string, attr: string) {
    const element = findTag(document, query);
    return element.length > 0 ? element.attr(attr) : "";
}

export function extrapolateAttrFromElement(element: cheerio.Cheerio<AnyNode>, attr: string) {
    return element.length > 0 ? element.attr(attr)?.toString() : "";
}

export function getChildOfParent(document: cheerio.CheerioAPI, parentQuery: string, childQuery: string) {
    const parentElement = findTag(document, parentQuery);
    if (parentElement.length > 0) {
        const childElement = parentElement.find(childQuery);
        return childElement.length > 0 ? childElement : null;
    }
    return null;
}

export function getChildOfParentFromElement(document: cheerio.CheerioAPI, parentElement:  cheerio.Cheerio<AnyNode>, childQuery: string) {
        const childElement = parentElement.find(childQuery);
        return childElement.length > 0 ? childElement : null;
}

export function loadCamera(document: cheerio.CheerioAPI, camN: number) : DeviceCamera {
    const searchedCamera = camN === 1 ? "Main Camera" : `Selfie camera`;

    const cameraType = findTag(document, `tr > th:contains("${searchedCamera}")`)
        .nextAll('td.ttl')
        .first()
        .find('a')
        .text()
        .trim();

    const cameras = extrapolateText(document, `td[data-spec="cam${camN}modules"]`);
    const camerasList = [] as DeviceCameraSpecs[];

    if (cameras) {
        cameras.split("<br />").forEach((cameraRaw) => {
            const camera = cameraRaw?.trim();
            if (!camera) return;

            const parts = camera.split(",").map(p => p.trim());

            camerasList.push({
                resolution: parts[0] || "",
                aperture: parts[1] || "",
                objective: parts[2] || "",
                features: parts.slice(3) || []
            });
        });
    }

    const cameraFeatures = extrapolateText(document, `td[data-spec="cam${camN}features"]`);
    const cameraFeaturesList = cameraFeatures ? cameraFeatures.split(",").map(feature => feature.trim()) : [];

    const cameraVideo = extrapolateText(document, `td[data-spec="cam${camN}video"]`);
    const cameraVideoList = cameraVideo ? cameraVideo.split(";")[0].trim().split(",").map((video) => {
        return video.trim();
    }) : [];

    const cameraOtherList = cameraVideo.split(";")[1] ? cameraVideo.split(";")[1].trim().split(",").map((other) => {
        return other.trim();
    }) : [];

    return {
        type: cameraType,
        specs: camerasList,
        features: cameraFeaturesList,
        video: cameraVideoList,
        other: cameraOtherList
    };
}

/// MISC
export function extrapolateDate(gsmarenaDate: string){
    try{
        const dateDivided = gsmarenaDate.split(",");
        const dateYear = parseInt(dateDivided[0]);

        const dateDivided2 = dateDivided[1].trim().split(" ");
        const dateMonth = fromStringToMonthNumber(dateDivided2[0]);
        const dateDay = parseInt(dateDivided2[1]);

        return `${dateYear}-${dateMonth.toString().padStart(2, '0')}-${dateDay.toString().padStart(2, '0')}`;
    }catch{
        console.error("Error extrapolating date:", gsmarenaDate);
        return gsmarenaDate;
    }
}

function fromStringToMonthNumber(monthString: string): number {
    const monthMap: { [key: string]: number } = {
        "january": 1,
        "february": 2,
        "march": 3,
        "april": 4,
        "may": 5,
        "june": 6,
        "july": 7,
        "august": 8,
        "september": 9,
        "october": 10,
        "november": 11,
        "december": 12
    };
    return monthMap[monthString.toLowerCase()] !== undefined ? monthMap[monthString.toLowerCase()] : -1;
}
