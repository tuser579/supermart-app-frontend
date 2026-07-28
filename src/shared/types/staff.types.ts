export interface StaffProfile {
  id: string;
  staffId: string;
  userId: string;
  position: string;
  shift: string;
  salary: number;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  earnings: number;
  assignedArea?: string[];
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    profileImage?: string | null;
  };
}

export interface Attendance {
  id: string;
  staffId: string;
  checkIn: string | null;
  checkOut: string | null;
  date: string;     // ISO datetime string from backend
  status?: string;
}

// Backend getEarnings returns this shape
export interface Earnings {
  earnings: number;          // total cumulative earnings
  totalDeliveries: number;
  rating: number;
  salary: number;
  deliveredOrders: number;   // count of delivered orders
  // Legacy fields kept for UI compatibility
  totalEarnings?: number;
  todayEarnings?: number;
  deliveries?: Array<{
    id: string;
    orderId: string;
    amount: number;
    date: string;
  }>;
  monthlySummary?: Array<{
    month: string;
    amount: number;
  }>;
}

export interface DashboardStats {
  todayDeliveries: number;
  totalEarnings: number;
  rating: number;
}

export interface TodayAttendanceStatus {
  attendanceId?: string;
  status: string | null;
  checkIn: string | null;
  checkOut: string | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
}

export interface StaffWorkloadSummary {
  totalAssignedOrders: number;
  activeDeliveriesCount: number;
  completedDeliveriesTodayCount: number;
}

export interface StaffQuickAction {
  action: string;
  method: string;
  endpoint: string;
  description: string;
}

export interface StaffQuickOptions {
  profile: {
    staffId: string;
    position: string;
    shift: string | null;
    rating: number;
    isAvailable: boolean;
    totalDeliveries: number;
    earnings: number;
  };
  todayAttendance: TodayAttendanceStatus;
  workload: StaffWorkloadSummary;
  recentAssignedOrders: Array<any>;
  quickActions: StaffQuickAction[];
}

