# GSMArena Scraper

A TypeScript library to access and manipulate data from the GSMArena site.
It works by scraping the GSMArena website with [Cheerio](https://cheerio.js.org/).

## Installation

```bash
npm install gsmarenaapi
```

## TypeScript usage

### Examples

#### 1. Get all brands

```typescript
import { getAllBrands } from "gsmarenaapi";

(async () => {
  const brands = await getAllBrands();
  console.log(brands);
})();
```

#### 2. Get all devices of a brand

```typescript
import { getAllDevicesOfBrand } from "gsmarenaapi";

(async () => {
  const devices = await getAllDevicesOfBrand("samsung-phones-9");
  console.log(devices);
})();
```

#### 3. Get device details

```typescript
import { getDevice } from "gsmarenaapi";

(async () => {
  const device = await getDevice("samsung_galaxy_s24_ultra-12024");
  console.log(device);
})();
```

#### 4. Search for devices

```typescript
import { search } from "gsmarenaapi";

(async () => {
  const results = await search("iPhone 15");
  console.log(results);
})();
```

#### 5. Full search

```typescript
import { fullSearch } from "gsmarenaapi";

(async () => {
  const results = await fullSearch("Galaxy");
  console.log(results);
})();
```

## JavaScript usage

### Examples

#### 1. Get all brands

```js
const { getAllBrands } = require("gsmarenaapi");

getAllBrands().then((brands) => console.log(brands));
```

#### 2. Get all devices of a brand

```js
const { getAllDevicesOfBrand } = require("gsmarenaapi");

getAllDevicesOfBrand("samsung-phones-9").then((devices) =>
  console.log(devices)
);
```

#### 3. Get device details

```js
const { getDevice } = require("gsmarenaapi");

getDevice("samsung_galaxy_s24_ultra-12024").then((device) =>
  console.log(device)
);
```

#### 4. Search for devices

```js
const { search } = require("gsmarenaapi");

search("iPhone 15").then((results) => console.log(results));
```

#### 5. Full search

```js
const { fullSearch } = require("gsmarenaapi");

fullSearch("Galaxy").then((results) => console.log(results));
```

## License

MIT
