export type OrganizationStatus = 'active' | 'inactive' | 'suspended';
export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: OrganizationStatus;
  max_devices: number;
  max_users: number;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'super_admin' | 'company_admin' | 'ehs' | 'supervisor' | 'worker' | 'developer';
export type ProfileStatus = 'active' | 'disabled' | 'invited';

export interface Profile {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  parent_id: string | null;
  status: ProfileStatus;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type DeviceConnectivity = 'online' | 'offline' | 'degraded';
export type DeviceStatus = 'available' | 'allocated' | 'maintenance' | 'retired';

export interface Device {
  id: string;
  uid: string;
  name: string | null;
  model: string | null;
  firmware_version: string | null;
  battery_level: number;
  connectivity: DeviceConnectivity;
  status: DeviceStatus;
  organization_id: string | null;
  latitude: number | null;
  longitude: number | null;
  last_seen_at: string | null;
  registered_at: string;
  updated_at: string;
}

export interface DeviceAllocation {
  id: string;
  device_id: string;
  organization_id: string;
  allocated_by: string | null;
  deallocated_at: string | null;
  created_at: string;
}

export type AlertType = 'sos' | 'fall' | 'geofence' | 'low_battery' | 'tamper' | 'panic' | 'impact';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'cancelled';

export interface Alert {
  id: string;
  device_id: string;
  organization_id: string | null;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  latitude: number | null;
  longitude: number | null;
  message: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'alert';

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  updated_at: string;
}

export type DeveloperRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DeveloperRequest {
  id: string;
  developer_name: string;
  developer_email: string;
  organization: string | null;
  scopes: string;
  purpose: string | null;
  status: DeveloperRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  filters: Record<string, unknown> | null;
  format: 'pdf' | 'csv' | 'excel';
  generated_by: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  file_url: string | null;
  created_at: string;
}
