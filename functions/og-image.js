import { ImageResponse, loadGoogleFont } from 'workers-og';

const BG     = '#0e0c0b';
const TEXT   = '#ddd9d4';
const MUTED  = '#6b6460';
const ACCENT = '#f5b574';

// Satori VDOM node. Passing objects (not an HTML string) to ImageResponse skips
// workers-og's HTMLRewriter, so there are no whitespace text nodes and no
// implicit-display surprises — every box here is an explicit flex container.
const h = (style, children) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

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
  const title  = searchParams.get('title') || 'Tenyoru';
  const type   = (searchParams.get('type') || '').toUpperCase();
  const date   = searchParams.get('date') || '';
  const desc   = searchParams.get('desc') || '';

  const [reg, bold] = await Promise.all([
    loadGoogleFont({ family: 'Inter', weight: 400 }),
    loadGoogleFont({ family: 'Inter', weight: 700 }),
  ]);

  const truncDesc = desc.length > 130 ? desc.slice(0, 130) + '…' : desc;
  const isSection = searchParams.get('section') === '1';

  // Section landing pages: the description is the headline (title color); the
  // section name sits bottom-left. Other pages: title headline, desc beneath.
  const headline = isSection ? (truncDesc || title) : title;
  const headlineSize = headline.length > 55 ? 52 : headline.length > 35 ? 60 : 72;
  const footerLeft = isSection
    ? type
    : [type, date]
        .filter(Boolean)
        .filter((p) => p.toUpperCase() !== title.toUpperCase())
        .join(' · ');

  const middle = [
    h({ color: TEXT, fontSize: headlineSize, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1px' }, headline),
  ];
  if (!isSection && truncDesc) {
    middle.push(h({ color: MUTED, fontSize: 22, lineHeight: 1.5 }, truncDesc));
  }

  const tree = h(
    { width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 72px', background: BG, fontFamily: 'Inter' },
    [
      h({ alignItems: 'center', gap: 10 }, [
        h({ width: 10, height: 10, background: ACCENT }, []),
        h({ color: MUTED, fontSize: 15, letterSpacing: '4px', textTransform: 'uppercase' }, 'Tenyoru'),
      ]),
      h({ flexDirection: 'column', gap: 20 }, middle),
      h({ justifyContent: 'space-between', alignItems: 'center' }, [
        h({ color: MUTED, fontSize: 15, letterSpacing: '2px', textTransform: 'uppercase' }, footerLeft),
        h({ color: ACCENT, fontSize: 15, letterSpacing: '2px', textTransform: 'uppercase' }, 'tenyoru.io'),
      ]),
    ],
  );

  const img = new ImageResponse(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: reg,  weight: 400 },
      { name: 'Inter', data: bold, weight: 700 },
    ],
  });

  const buf = await img.arrayBuffer();
  const response = new Response(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
  context.waitUntil(cache.put(context.request, response.clone()));
  return response;
}
