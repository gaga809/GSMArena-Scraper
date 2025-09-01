export interface Brand {
  id: string;
  name: string;
  numberOfDevices: number;
}

/* DEVICE SUMMARY */
export interface DeviceSummary {
  id: string;
  url: string;
  name: string;
  fullName: string;
  announced: string;
  img: string;
  specs: DeviceSummarySpecs;
}

export interface DeviceSummarySpecs {
  inchDisplay: string;
  chipset: string;
  primaryCamera: string;
  selfieCamera: string;
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
  network: DeviceNetwork;
  launch: DeviceLaunch;
  body: DeviceBody;
  display: DeviceDisplay;
  platform: DevicePlatform;
  memory: DeviceMemory;
  mainCamera: DeviceCamera;
  selfieCamera: DeviceCamera;
  sound: DeviceSound;
  comms: DeviceComms;
  features: DeviceFeatures;
  battery: DeviceBattery;
  misc: DeviceMisc;
  pictures: string[];
  //reviews: string[]; // Will be added in the future
}

export interface DeviceNetwork {
  technology: string;
  bands2G: string;
  bands3G: string;
  bands4G: string;
  bands5G: string;
  speed: string;
}

export interface DeviceLaunch {
  announced: string;
  status: string;
  releaseDate: string | null;
}

export interface DeviceBody {
  dimensions: DeviceBodyDimensions;
  weight: DeviceBodyWeight;
  build: string;
  sim: string;
  other: string[];
}

export interface DeviceBodyDimensions {
  heightMM: number; // Dimensions in millimeters
  widthMM: number;
  depthMM: number;
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
  others: string[];
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
  pixelDensityPPI: string;
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
  upTo: string | null;
  customName: string | null;
}

export interface DeviceMemory {
  cardSlot: string;
  internal: DeviceMemoryInternal;
}

export interface DeviceMemoryInternal {
  storageOptions: DeviceMemoryInternalStorageOption[];
  other: string;
}

export interface DeviceMemoryInternalStorageOption {
  storage: string;
  memory: string;
}

export interface DeviceCamera {
  type: string;
  specs: DeviceCameraSpecs[];
  features: string[];
  video: string[];
  other: string[];
}

export interface DeviceCameraSpecs {
  resolution: string;
  aperture: string;
  objective: string;
  features: string[];
}

export interface DeviceSound {
  loudSpeaker: string;
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

export interface DeviceFeatures {
  sensors: string[];
  other: string[];
}

export interface DeviceBattery {
  type: string;
  charging: string[];
}

export interface DeviceMisc {
  colors: string[];
  models: string[];
  price: string;
  sar: DeviceMiscSar | null;
}

export interface DeviceMiscSar {
  eu: DeviceMiscSarSpecs | null;
  other: DeviceMiscSarSpecs | null;
}

export interface DeviceMiscSarSpecs {
  head: string;
  body: string;
}

// SEARCH
export type AdvancedSearchOptions =
  | SelectOption
  | MultiSelectOption
  | RangeOption
  | BooleanOption;

export interface BaseCategory {
  name: string;
  type: "select" | "multi-select" | "range" | "checkbox" | "select-divided";
}

export interface BaseOption {
  name: string;
  label: string;
}

export interface SelectOption extends BaseCategory {
  values: BaseOption[];
}

export interface SelectOptionDivided extends BaseCategory {
  values: { [key: string]: BaseOption[] };
}

export interface MultiSelectOption extends BaseCategory {
  values: BaseOption[];
}

export interface RangeOption extends BaseCategory {
  min: number;
  max: number;
}

export interface BooleanOption extends BaseCategory {
  selected?: boolean;
}

export interface AdvancedSearchQuery {
  mode?: "cellphone" | "tablet";
  brand?: number[] | null;
  yearMin?: number | null;
  yearMax?: number | null;
  availability?: number[] | null;
  priceMin?: number | null;
  priceMax?: number | null;
  network?: AdvancedSearchQueryNetwork | null;
  sim?: AdvancedSearchQuerySim | null;
  body?: AdvancedSearchQueryBody | null;
  platform?: AdvancedSearchQueryPlatform | null;
  memory?: AdvancedSearchQueryMemory | null;
  display?: AdvancedSearchQueryDisplay | null;
  mainCamera?: AdvancedSearchQueryCamera | null;
  selfieCamera?: AdvancedSearchQuerySelfieCamera | null;
  audio?: AdvancedSearchQueryAudio | null;
  sensors?: AdvancedSearchQuerySensors | null;
  connectivity?: AdvancedSearchQueryConnectivity | null;
  battery?: AdvancedSearchQueryBattery | null;
  misc?: AdvancedSearchQueryMisc | null;
}

export interface AdvancedSearchQueryNetwork {
  net2g?: string[] | null;
  net3g?: string[] | null;
  net4g?: string[] | null;
  net5g?: string[] | null;
}

export interface AdvancedSearchQuerySim {
  dualsim?: boolean | null;
  esim?: boolean | null;
  size?: number[] | null;
}

export interface AdvancedSearchQueryBody {
  formFactor?: number[] | null;
  keyboardWithQwerty?: boolean | null;
  heightMin?: number | null;
  heightMax?: number | null;
  widthMin?: number | null;
  widthMax?: number | null;
  thicknessMin?: number | null;
  thicknessMax?: number | null;
  weightMin?: number | null;
  weightMax?: number | null;
  ipCertificate?: number[] | null;
  color?: string | null;
  backMaterial?: number[] | null;
  frameMaterial?: number[] | null;
}

export interface AdvancedSearchQueryPlatform {
  os?: number | null;
  osVersion?: number | null;
  chipset?: number[] | null;
  cpuCoresMin?: number | null;
  cpuCoresMax?: number | null;
}

export interface AdvancedSearchQueryMemory {
  ram?: number | null;
  storage?: number | null;
  cardSlot?: number | null;
}

export interface AdvancedSearchQueryDisplay {
  resolutionMin?: number | null;
  resolutionMax?: number | null;
  sizeMin?: number | null; // In inches
  sizeMax?: number | null; // In inches
  densityMin?: number | null; // In pixels per inch
  densityMax?: number | null; // In pixels per inch
  technology?: number | null;
  notch?: number | null;
  refreshRateMin?: number | null;
  refreshRateMax?: number | null;
  hdr?: boolean | null;
  oneBColors?: boolean | null;
}

export interface AdvancedSearchQueryCamera {
  resolutionMin?: number | null;
  resolutionMax?: number | null;
  cameras?: number[] | null;
  ois?: boolean | null;
  fNumberMin?: number | null;
  fNumberMax?: number | null;
  telephoto?: boolean | null;
  ultrawide?: boolean | null;
  video?: number | null;
  flash?: number[] | null;
}

export interface AdvancedSearchQuerySelfieCamera {
  resolutionMin?: number | null;
  resolutionMax?: number | null;
  dualCamera?: boolean | null;
  ois?: boolean | null;
  frontFlash?: boolean | null;
  popupCamera?: boolean | null;
  underDisplayCamera?: boolean | null;
}

export interface AdvancedSearchQueryAudio {
  jack?: boolean | null;
  dualSpeakers?: boolean | null;
}

export interface AdvancedSearchQuerySensors {
  fingerprint?: number[] | null;
  accelerometer?: boolean | null;
  gyroscope?: boolean | null;
  proximity?: boolean | null;
  barometer?: boolean | null;
  heartRate?: boolean | null;
  compass?: boolean | null;
}

export interface AdvancedSearchQueryConnectivity {
  wlans?: number[] | null;
  bluetooth?: number[] | null;
  gps?: number[] | null;
  nfc?: boolean | null;
  infrared?: boolean | null;
  fmRadio?: boolean | null;
  usb?: number | null;
}

export interface AdvancedSearchQueryBattery {
  capacityMin?: number | null;
  capacityMax?: number | null;
  sic?: boolean | null;
  removable?: boolean | null;
  wiredChargingMin?: number | null;
  wiredChargingMax?: number | null;
  wirelessChargingMin?: number | null;
  wirelessChargingMax?: number | null;
}

export interface AdvancedSearchQueryMisc {
  freeText?: string | null;
  orderBy?: number | null;
  reviewedOnly?: boolean | null;
}
