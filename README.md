
# GSMarenaApi

A TypeScript library to access and manipulate data from the GSMArena site.



## Installation

```bash
npm install gsmarenaapi
```


## Usage

To access the library methods you need to import it in your TypeScript / JavaScript code

```typescript
import { getBrands, getDevicesByBrand, getDeviceDetails } from 'gsmarenaapi';
```

Examples of how to use the main functions:


### 1. Get the list of brands
```typescript
(async () => {
	const brands = await getBrands();
	console.log(brands);
})();
```


### 2. Get details of a device
```typescript
(async () => {
	const details = await getDeviceDetails('samsung_galaxy_s24_ultra-12024');
	console.log(details);
})();
```


## License
MIT
