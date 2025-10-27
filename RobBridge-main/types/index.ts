export interface BarcodeData {
  id: string;
  code: string;
  format: string;
  productName: string;
  description?: string;
  price?: number;
  category?: string;
  createdAt: Date;
  imageUrl?: string;
}

export interface RobotTelemetry {
  battery: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  temperature: number;
  orientation: {
    pitch: number;
    roll: number;
    yaw: number;
  };
  status: 'idle' | 'moving' | 'error' | 'charging';
  speed: number;
}

export interface SystemHealth {
  database: 'online' | 'offline' | 'error';
  robot: 'connected' | 'disconnected' | 'error';
  performance: number; // 0-100
  lastUpdate: Date;
}

export interface ActivityEvent {
  id: string;
  type: 'barcode_scan' | 'barcode_generate' | 'robot_move' | 'image_process' | 'system_alert';
  message: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'error';
}

export interface ImageFilter {
  grayscale: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export interface RobotControl {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  speed: number;
  emergencyStop: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  avatar?: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}
