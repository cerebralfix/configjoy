import { NextResponse, NextRequest } from 'next/server'
import { dataObjects } from './generated/react/outer-data';

export async function middleware(req, ev) {
    const { pathname } = req.nextUrl
    if (pathname == '/') {
        return NextResponse.redirect('http://localhost:__PORT__/generated/' + dataObjects[0])
    }
    return NextResponse.next()
}