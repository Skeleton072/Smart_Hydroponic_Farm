export type FarmNodeTypes = {
  node_id: string;
  node_name: string;
  min_temperature: string;
  min_humidity: string;
  min_pH: string;
  min_tds: string;
  max_temperature: string;
  max_humidity: string;
  max_pH: string;
  max_tds: string;
}

export type FarmNodeUploadTypes = {
  node_name: string;
  min_temperature: string;
  min_humidity: string;
  min_pH: string;
  min_tds: string;
  max_temperature: string;
  max_humidity: string;
  max_pH: string;
  max_tds: string;
}

export type NumericSensorKey = 
  | "min_temperature" 
  | "max_temperature"
  | "min_humidity" 
  | "max_humidity"
  | "min_pH" 
  | "max_pH"
  | "min_tds" 
  | "max_tds";