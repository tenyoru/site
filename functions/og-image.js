import { ImageResponse, loadGoogleFont } from 'workers-og';

// Palette matches the site's light theme ($themes.light in assets/scss/theme/_colors.scss).
const BG      = '#f8f4e9';
const HEADING = '#171310';
const MUTED   = '#756a58';
const ACCENT  = '#1d4ed8';
const SERIF   = 'Source Serif 4';

// Same grain SVG as body::after in assets/scss/layout/_structure.scss
const GRAIN_URL = 'url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%25" height="100%25" filter="url(%23n)"/></svg>)';
const GRAIN_OPACITY = 0.05; // ponytail: tuned higher than the site's 0.03 so it survives social-platform JPEG recompression

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

  const [reg, bold, serif] = await Promise.all([
    loadGoogleFont({ family: 'Inter', weight: 400 }),
    loadGoogleFont({ family: 'Inter', weight: 700 }),
    loadGoogleFont({ family: SERIF, weight: 400 }),
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
    h({ color: HEADING, fontSize: headlineSize, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1px' }, headline),
  ];
  if (!isSection && truncDesc) {
    middle.push(h({ color: MUTED, fontSize: 22, lineHeight: 1.5 }, truncDesc));
  }

  const tree = h(
    { width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 72px', background: BG, fontFamily: 'Inter', position: 'relative' },
    [
      h({ alignItems: 'center', gap: 10, fontFamily: SERIF }, [
        h({ width: 10, height: 10, background: ACCENT }, []),
        h({ color: MUTED, fontSize: 15, letterSpacing: '4px', textTransform: 'uppercase' }, 'Tenyoru'),
      ]),
      h({ flexDirection: 'column', gap: 20 }, middle),
      h({ justifyContent: 'space-between', alignItems: 'center', fontFamily: SERIF }, [
        h({ color: MUTED, fontSize: 15, letterSpacing: '2px', textTransform: 'uppercase' }, footerLeft),
        h({ color: ACCENT, fontSize: 15, letterSpacing: '2px', textTransform: 'uppercase' }, 'tenyoru.io'),
      ]),
      h({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat', opacity: GRAIN_OPACITY }, []),
    ],
  );

  const img = new ImageResponse(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: reg,   weight: 400 },
      { name: 'Inter', data: bold,  weight: 700 },
      { name: SERIF,   data: serif, weight: 400 },
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
