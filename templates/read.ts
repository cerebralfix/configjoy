// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as fs from "fs";

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const data = JSON.parse(fs.readFileSync(`__DATA_DIRECTORY__/${req.query.messageName}`, 'utf-8'));
    res.status(200).json({ success: true, data: { data } })
}
