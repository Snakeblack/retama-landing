import type { RSSOptions } from "@astrojs/rss";
import { type Locale, t } from "../i18n/index";
import { articlePath, feedPath } from "./blog";

/** An article as the RSS gives it: its summary and its link, not its text. */
export interface FeedItem {
  title: string;
  description: string;
  published: Date;
  path: string;
}

/** The RSS 2.0 of a language's blog (@astrojs/rss), with its language and its own address as validators ask. */
export function feedOptions(site: URL, locale: Locale, items: FeedItem[]): RSSOptions {
  const copy = t(locale);
  return {
    title: copy["blog.metaTitle"],
    description: copy["blog.metaDescription"],
    site: new URL(articlePath(locale), site).href,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `<language>${locale}</language><atom:link href="${new URL(feedPath(locale), site).href}" rel="self" type="application/rss+xml"/>`,
    items: items.map(({ title, description, published, path }) => ({
      title,
      description,
      pubDate: published,
      link: new URL(path, site).href,
    })),
  };
}
