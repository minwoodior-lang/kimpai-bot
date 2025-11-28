import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
  status: string;
  timestamp: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({
    message: "Welcome to KimpAI API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
