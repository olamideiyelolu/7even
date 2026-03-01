import { Platform } from 'react-native';

const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const defaultOrigin = `http://${defaultHost}:4000`;

export const API_ORIGIN = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || defaultOrigin;
export const API_BASE_URL = `${API_ORIGIN}/api`;
