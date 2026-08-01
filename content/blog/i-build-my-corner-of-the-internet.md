+++
date = '2026-06-28T03:31:34+02:00'
title = "I Build My Corner of the Internet – Here's Why"
description = "Made my own site to replace social media: no algorithms, no search, no comments. Minimal design, instant loading, nothing extra."
cover = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Paul_Klee%2C_Swiss_-_Fish_Magic_-_Google_Art_Project.jpg/960px-Paul_Klee%2C_Swiss_-_Fish_Magic_-_Google_Art_Project.jpg"
tags = ['meta', 'web']
+++

> **Note:** Unfortunately, no time to translate this properly, so AI did it from the original [Russian version](/ru/blog/i-build-my-corner-of-the-internet/).

## Introduction
Every time I visited [HackerNews](https://news.ycombinator.com/), I'd spend hours browsing developers' sites. Some are as simple as they get: a plain page, like a sheet of colored paper, with a handful of posts. Others are full-blown sites with sections, features, and complex navigation. After a few evenings like that, I turned to Google with a simple question: "What framework should I use for a blog?" — and that's how I met [SSGs](https://en.wikipedia.org/wiki/Static_site_generator) (Static Site Generators) and [Hugo](https://gohugo.io/), one of the most popular ones.

## Why I wanted a website
Originally the goal was a simple landing page built on an [SSG](https://en.wikipedia.org/wiki/Static_site_generator), so people could always find my contacts — my friends and I had repeatedly lost touch after deleting our accounts somewhere. The obvious fix seems to be: don't delete accounts, use the same username everywhere. But circumstances vary.

I also have friends in Russia, and with the new closed-internet policy and announcements about restricting access to messengers and social networks, I started worrying I'd lose touch with them too.

Over time the idea grew into something bigger. I wanted a corner where I could publish my thoughts, notes, projects, observations — just keep a part of my life out in the open. So this site became my one-way social space.

## Social media
So why not social media?
Honestly, I'm allergic to it. I don't know why, but I just can't treat it as something "mine." And I don't want to spend attention or time on it either.

There's now a huge number of platforms, each with its own audience, which creates a different problem: there's no single place someone can just open and calmly look at content without cookie popups, ads, sign-up prompts, app install nags, or subscribe requests burying the actual content.

Especially with age-verification policies on the horizon. Several countries have already introduced mandatory verification on social platforms: Australia banned under-16s from using them, followed by Brazil, Indonesia, Malaysia. The UK and several US states are heading the same direction. Platforms have to comply, and with compliance comes tighter collection of personal data. A personal site falls outside all of that: it's not a platform, it doesn't collect data, and it asks nothing of the reader but a browser.

Yes, [ActivityPub](https://activitypub.rocks/) and [ATProto](https://atproto.com/) exist — attempts to build a more open internet — but with far fewer active participants (not the main issue) and still someone else's platform, where I'm not dependent on one server but on the technology as a whole. And they too will eventually have to follow local regulations.

The second problem is recommendations and the whole culture of content consumption. I have no interest in following someone's life day to day or endlessly scrolling an algorithm-fed feed. Maybe it's because a lot of people try to present themselves better than they are: the prettiest photos, forced smiles, perfect moments. But that's never grabbed me.

I genuinely don't care what car you drive, what you ate today, where you vacationed, what bouquet you got, or why your partner left you. Sure, social media is sometimes useful — to get a sense of what someone's into, what they live for. But to me a conversation is far more valuable: live, honest, full of emotion, thought, and soul. The format of modern content rarely reveals a person for real. It shows an image, not a personality.

That said, I'm not against social media — reach, recommendation algorithms, and virality make it a great tool for promotion and personal branding. I might use it eventually, just not as my main platform.

## One-way
By "one-way" I mean a single-direction channel of communication. Take a speaker's monologue on stage: you __can__ only listen, without asking questions. The opposite is a discussion — you don't just listen, you respond, argue, react. A one-way format frees the author from having to mind the audience's reaction and lets them focus on the content. Of course, at the end of a talk the speaker can take questions — but only once all the information has already landed, so the questions are actually to the point.

The audience doesn't disappear here, though. On the contrary — it's the reader who shapes the choice of topic, language, and delivery. The difference is that the author makes those calls ahead of time, without watching for a real-time reaction. A monologue takes more preparation than a dialogue: you can't clarify, you can't ask again, you have to get it right the first time.

I emphasized the word "can" on purpose — it's a possibility, not an obligation. You're always free to share your opinion or correct me, and I'd genuinely welcome it. But messengers work better for that: all my contacts are on the [contact](/contact/) page.

## Comments

A word about comments under posts specifically. There are plenty of ready-made solutions: [Giscus](https://giscus.app/), [Utterances](https://utteranc.es/), [Cusdis](https://cusdis.com/), [Disqus](https://disqus.com/). I skipped them for two reasons: design and relevance.

The two are related. With a small audience, only a tiny fraction of readers will ever leave a comment — the well-known [1% rule](https://en.wikipedia.org/wiki/1%25_rule). An empty comment section looks worse than no comment section at all: it makes the place feel abandoned and scares off new readers. On top of that, not every comment is worth reading, and a growing audience inevitably brings a need for moderation.

I agree with [Sonia Simone](https://copyblogger.com/removing-blog-comments/): comments belong elsewhere — on other people's blogs, in messengers, or on social media (as paradoxical as that sounds). The first is still the same kind of monologue I described above. The second suits a live discussion, where reaching consensus is easier. The third at least gets you some exposure.

## Design
When I first wanted to build a landing page, I wanted something elaborate — a unique, visually memorable design. Show identity through aesthetics. For that I picked the image of a ballerina in halftone, dancing on circles. But I soon realized abstract, busy layouts aren't what actually matters on a site: what matters to the reader is content — text. So I moved toward as minimal a design as possible, one where the reader never has to get distracted by animations or a confusing layout. Everything had to feel native.

### Layout
There are many ways to direct a user's attention: the key is that elements either follow a deliberate layout or deliberately break from it. I chose a different route — don't think. To get the most native-feeling design possible, I basically had to switch my brain off and focus purely on readability, so on the site everything flows top to bottom, like a book.

### 5 colors are more than enough
Color is a tool. It answers one question: what matters and what doesn't. The moment color starts doing anything else, it turns into noise.

Five was enough for me:

- **Background** — I think that one's self-explanatory
- **Text** — the main content people came here for
- **Bright** — handles structure: headings and the page's anchor points
- **Muted** — everything quieter than the main text: dates, captions, navigation, descriptions
- **Accent** — catches the eye on details worth noticing: links, important words, design elements that need highlighting

Over time I split "muted" into two: one for text that's still meant to be read, like descriptions and quotes; another for purely functional bits, like dates and navigation. Beyond these five there are a couple more colors for specific elements like cards and borders, but those aren't standalone colors — just shades within the same categories.

### Why I don't want to make this site multilingual

I'm currently in Belgium, which has three national languages. In each region the signs are mostly in one: French, German, or Dutch — depending on the local population. Do I need to know all three to travel this wonderful country freely? No! I can use translation tools, ask people, or plan my route ahead of time.

I don't want to translate every page into every language I know or am learning, so I prefer the international one — English. Why?

- **First**, maintenance overhead: change one page, and you're obligated to update every other version too. I want translating to stay an enjoyable activity, not a chore — otherwise sooner or later I'll want to dump it on AI;
- **second**, browsers already ship a decent enough translator built in.

So I'll treat translating posts as an interesting hobby and a bit of practice.

## Under the hood
The site itself came out of curiosity about [SSGs](https://en.wikipedia.org/wiki/Static_site_generator), so I went looking for something lightweight, fast, and Markdown-friendly for blogging.

Here's the list of generators I looked at:
- [Hugo](https://gohugo.io/) — one of the most popular: fast, convenient, has everything you need and then some
- [Zola](https://www.getzola.org/) — a solid Hugo alternative
- [Zine](https://zine-ssg.io/) — minimalist, written in Zig
- [Astro](https://astro.build/) — a heavier framework with SPA and a server-first approach

You can also browse [this list](https://github.com/myles/awesome-static-generators).

I settled on [Hugo](https://gohugo.io/) for its maturity and popularity. Honestly, there's not much more to add, except one thing: I didn't use a ready-made theme or template (though I'd recommend it to others — it saves a ton of time). Otherwise, I'm very happy with the choice.

### Loading only part of the page
During development, another reason surfaced — the white flash on internal navigations. Every time, the browser reloads and re-renders the whole page, and even though it only takes a couple dozen milliseconds, that's enough for the eye to catch an unpleasant flicker and ruin the first impression. So I thought: why re-fetch and re-render the CSS and HTML from scratch when you can just update the `body` and `header`? At first it seemed like I was building something close to an [SPA](https://en.wikipedia.org/wiki/Single-page_application).

But it's not an SPA: the pages remain real, only part of them gets swapped out. As I found out later, the technique already has a name — [PJAX](https://github.com/MoOx/pjax): swap part of the page instead of doing a full reload. Turns out I reinvented the wheel, but building it from scratch was still more satisfying — if nothing else, to avoid dragging in a whole library for one idea: the entire router fits in under two hundred lines.

I also added prefetching on hover, with a 150ms delay. The logic is simple: by the time a cursor rests on a link, it's usually over ~200ms before the actual click, so 150ms gives the page a head start to load in advance. That delay also filters out accidental hovers — when the cursor just glides across links, nothing extra gets loaded. By the time the click happens, the page is already loaded and ready to swap in. The transition feels instant.

And all of this is just an enhancement layer. Turn off JavaScript, and the swapping and prefetching simply disappear, leaving a plain set of static pages: every link is real, every page is an actual HTML file. There's nothing to break.

### Inline or external
I could have moved the CSS into a separate file so it wouldn't ride along with every page and would get cached once instead. But it's only 5.7KB, and an external file would add an extra round-trip before the first paint. Losing an instant first screen wasn't worth that saving. And even with inline CSS, the page comes in under the [14KB rule](https://endtimes.dev/why-your-website-should-be-under-14kb-in-size/) when compressed, meaning the first screen arrives in a single round-trip.

Icons are the opposite. I don't inline them into the page — I bundle them into one external SVG sprite: each icon becomes a `<symbol>`, and the page keeps only a short `<use href="…">` reference to it. The sprite loads once, gets cached, and serves every icon from then on. If I inlined them instead, the same icon would repeat on every occurrence and get shipped again with every page. So why is CSS inline but icons external? CSS is needed to paint the page at all — without it there's nothing to render, and an extra round-trip for it isn't worth the wait. Icons load dynamically and block nothing, so they can safely live in a separate, cacheable file. Same story with JavaScript.

### Hosting for static sites

A quick word on hosting. There are plenty of options, many free or with a very generous free tier. To squeeze even more speed out of an already-fast site, I'd recommend [Vercel](https://vercel.com/) or [Cloudflare Pages](https://pages.cloudflare.com/) — both come with a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network) that serves files from servers closest to the reader.

## My place
I built my own private, independent corner where I can do whatever I want. Whether you need one too isn't my call to make. But I'm glad this one's mine.
