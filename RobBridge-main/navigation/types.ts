import { DrawerNavigationProp } from '@react-navigation/drawer';

export type RootDrawerParamList = {
  Dashboard: undefined;
  BarcodeScanner: undefined;
  BarcodeGenerator: undefined;
  ImageProcessor: undefined;
  RobotControl: undefined;
  RackStatus: undefined;
  RackManagement: undefined;
  RackSettings: undefined;
  ProductMovement: undefined;
  ESP32Control: undefined;
  History: undefined;
  Settings: undefined;
  ProfileAccount: undefined;
};

export type RootDrawerNavigationProp = DrawerNavigationProp<RootDrawerParamList>;

export type DashboardStackParamList = {
  DashboardMain: undefined;
  Analytics: undefined;
  ActivityLog: undefined;
};

export type BarcodeStackParamList = {
  Scanner: undefined;
  Generator: undefined;
  History: undefined;
  ProductDetails: { barcodeId: string };
};

export type RobotStackParamList = {
  Control: undefined;
  Telemetry: undefined;
  Tasks: undefined;
  Configuration: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Database: undefined;
  Users: undefined;
  System: undefined;
};
