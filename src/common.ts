import * as cheerio from "cheerio";

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
