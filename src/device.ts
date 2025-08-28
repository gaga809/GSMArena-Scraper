import * as cheerio from "cheerio";
import { BASE_URL, fetchPage } from "./common.js";
import fs from "fs";

export async function getDevice(deviceId: string) {
    try {
        const $ = await fetchPage(`${BASE_URL}${deviceId}.php`);
        if (!$) {
            throw new Error(
                `Failed to fetch device data: CheerioAPI object is null or undefined`
            );
        }
        fs.writeFileSync(`htmlOut.html`, $.html() || "");
    } catch (error) {
        throw new Error("[FETCH PAGE] " + error);
    }
}
