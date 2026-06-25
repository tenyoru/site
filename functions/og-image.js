import { ImageResponse, loadGoogleFont } from 'workers-og';

const BG     = '#0e0c0b';
const TEXT   = '#ddd9d4';
const MUTED  = '#6b6460';
const ACCENT = '#f5b574';

export const onRequest = async (context) => {
  try {
    return await render(context);
  } catch (err) {
    return new Response(err?.stack || err?.message || String(err), {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

async function render(context) {
  const cache = caches.default;
  const hit = await cache.match(context.request);
  if (hit) return hit;

  const { searchParams } = new URL(context.request.url);
  const title = searchParams.get('title') || 'Tenyoru';
  const type  = (searchParams.get('type') || '').toUpperCase();
  const date  = searchParams.get('date') || '';
  const desc  = searchParams.get('desc') || '';

  const [reg, bold] = await Promise.all([
    loadGoogleFont({ family: 'Inter', weight: 400 }),
    loadGoogleFont({ family: 'Inter', weight: 700 }),
  ]);

  const titleSize = title.length > 55 ? 52 : title.length > 35 ? 60 : 72;
  const footerLeft = [type, date].filter(Boolean).join(' · ');
  const truncDesc = desc.length > 130 ? desc.slice(0, 130) + '…' : desc;

  const html = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:56px 72px;background:${BG};font-family:Inter">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:10px;height:10px;background:${ACCENT}"></div>
        <span style="color:${MUTED};font-size:15px;letter-spacing:4px;text-transform:uppercase">Tenyoru</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:20px">
        <div style="color:${TEXT};font-size:${titleSize}px;font-weight:700;line-height:1.1;letter-spacing:-1px">${title}</div>
        ${truncDesc ? `<div style="color:${MUTED};font-size:22px;line-height:1.5">${truncDesc}</div>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:${MUTED};font-size:15px;letter-spacing:2px;text-transform:uppercase">${footerLeft}</span>
        <span style="color:${ACCENT};font-size:15px;letter-spacing:2px;text-transform:uppercase">tenyoru.io</span>
      </div>
    </div>
  `;

  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: reg,  weight: 400 },
      { name: 'Inter', data: bold, weight: 700 },
    ],
  });

  response.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  context.waitUntil(cache.put(context.request, response.clone()));
  return response;
}
