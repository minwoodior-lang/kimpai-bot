import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type IconMap = Record<string, string>;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<IconMap>
) {
  try {
    const filePath = path.join(process.cwd(), "data", "exchangeIcons.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const iconMap = JSON.parse(fileContent) as IconMap;

    res.status(200).json(iconMap);
  } catch (error) {
    console.error("Failed to read icons:", error);
    res.status(500).json({});
  }
}
