export interface Brand {
    id: string;
    name: string;
    numberOfDevices: number;
}

/* DEVICE SUMMARY */
export interface DeviceSummary {
    id: string;
    name: string;
    fullName: string;
    brand: Brand;
    announced: string;
    specs: DeviceSummarySpecs;
}

export interface DeviceSummarySpecs {
    inchDisplay: string;
    chipset: string;
    battery: string;
    storage: string;
    memory: string;
    otherFeatures: string[];
}

/* DEVICES */
export interface Device {
    id: string;
    name: string;
    photo: string;
    network: string[];
    launch: DeviceLaunch;
    body: DeviceBody;
    display: DeviceDisplay;
    platform: DevicePlatform;
    memory: DeviceMemory;
    mainCamera: DeviceCamera;
    selfieCamera: DeviceCamera;
    sound: DeviceSound;
    comms: DeviceComms;
    features: string[];
    battery: DeviceBattery;
    misc: DeviceMisc;
    pictures: string[];
    //reviews: string[]; // Will be added in the future
}

export interface DeviceLaunch {
    announced: string;
    status: string;
    releaseDate: string | null;
}

export interface DeviceBody {
    dimensions: DeviceBodyDimensions;
    weight: DeviceBodyWeight;
    build: string[];
    sim: string[];
    other: string[];
}

export interface DeviceBodyDimensions {
    heightCM: number; // Dimensions in centimeters
    widthCM: number;
    depthCM: number;
    heightInch: number; // Dimensions in inches
    widthInch: number;
    depthInch: number;
}

export interface DeviceBodyWeight {
    weightG: number; // Weight in grams
    weightOz: number; // Weight in ounces
}

export interface DeviceDisplay {
    type: string;
    size: DeviceDisplayDimensions;
    resolution: DeviceDisplayResolution;
    protection: string[];
}

export interface DeviceDisplayDimensions {
    areaCM: number; // Dimensions in centimeters
    areaInch: number; // Dimensions in inches
    screenToBodyRatio: string;
}

export interface DeviceDisplayResolution {
    width: number;
    height: number;
    ratio: string;
    pixelDensityPPI: number;
}

export interface DevicePlatform {
    os: DevicePlatformOS;
    chipset: string;
    cpu: string;
    gpu: string;
}

export interface DevicePlatformOS {
    name: string;
    version: string;
    customName: string | null;
}

export interface DeviceMemory {
    cardSlot: string;
    internal: DeviceMemoryInternal;
}

export interface DeviceMemoryInternal {
    storageOptions: DeviceMemoryInternalStorageOption[];
    memory: string;
    type: string;
}

export interface DeviceMemoryInternalStorageOption {
    storage: string;
    memory: string;
}

export interface DeviceCamera {
    type: string;
    specs: DeviceCameraSpecs[];
    feaures: string[];
    video: string[];
}

export interface DeviceCameraSpecs {
    resolution: string;
    aperture: string;
    objective: string;
    features: string[];
}

export interface DeviceSound {
    loudspeaker: string;
    jack: string;
}

export interface DeviceComms {
    wlan: string[];
    bluetooth: string[];
    gps: string[];
    nfc: string;
    infrared: string | null;
    radio: string;
    usb: string[];
}

export interface DeviceBattery {
    type: string;
    capacitymAh: number;
    charging: string[];
    others: string[];
}

export interface DeviceMisc {
    colors: string[];
    models: string[];
    price: string;
    sar: DeviceMiscSar | null;
    others: string[];
}

export interface DeviceMiscSar {
    eu: DeviceMiscSarSpecs;
    other: DeviceMiscSarSpecs;
}

export interface DeviceMiscSarSpecs {
    head: string;
    body: string;
}
