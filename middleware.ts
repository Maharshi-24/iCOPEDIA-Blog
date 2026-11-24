// Vercel Routing Middleware: runs before static files are served, which a
// vercel.json rewrite can't do for "/" (index.html would win).
//
// manufacturer.icopedia.co is served by this same project. Its "/" is the
// manufacturer home page, prerendered to manufacturers.html (src/pages/
// ManufacturerHome.tsx); App.tsx renders the same page in the browser there.
// Its other links are redirected to icopedia.co in vercel.json.
import { next, rewrite } from '@vercel/edge';

export const MANUFACTURER_HOST = 'manufacturer.icopedia.co';

export const config = { matcher: '/' };

export default function middleware(request: Request) {
  if (new URL(request.url).hostname === MANUFACTURER_HOST) {
    return rewrite(new URL('/manufacturers', request.url));
  }
  return next();
}
