// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as fs from "fs";

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    fs.writeFileSync(`__DATA_DIRECTORY__/${req.body.messageName}`, JSON.stringify(req.body.data, null, 2));
    res.status(200).json({ success: true })
}
