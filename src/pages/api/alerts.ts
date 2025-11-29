import type { NextApiRequest, NextApiResponse } from "next";

interface Alert {
  id: string;
  userId: string;
  type: "premium" | "price" | "volume";
  asset: string;
  condition: "above" | "below";
  value: number;
  active: boolean;
  triggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

interface AlertsResponse {
  success: boolean;
  data: Alert[];
  total: number;
  active: number;
}

const mockAlerts: Alert[] = [
  {
    id: "alert_001",
    userId: "user_123",
    type: "premium",
    asset: "BTC",
    condition: "above",
    value: 5,
    active: true,
    triggered: false,
    triggeredAt: null,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "alert_002",
    userId: "user_123",
    type: "price",
    asset: "ETH",
    condition: "below",
    value: 4500000,
    active: true,
    triggered: true,
    triggeredAt: "2024-01-16T14:22:00Z",
    createdAt: "2024-01-14T08:15:00Z",
  },
  {
    id: "alert_003",
    userId: "user_123",
    type: "premium",
    asset: "XRP",
    condition: "above",
    value: 6,
    active: false,
    triggered: false,
    triggeredAt: null,
    createdAt: "2024-01-10T16:45:00Z",
  },
  {
    id: "alert_004",
    userId: "user_123",
    type: "volume",
    asset: "SOL",
    condition: "above",
    value: 500000000,
    active: true,
    triggered: false,
    triggeredAt: null,
    createdAt: "2024-01-12T09:00:00Z",
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AlertsResponse>
) {
  const activeCount = mockAlerts.filter((alert) => alert.active).length;

  res.status(200).json({
    success: true,
    data: mockAlerts,
    total: mockAlerts.length,
    active: activeCount,
  });
}
