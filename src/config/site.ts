export type SiteConfig = {
  title: string;
  url: string;
  ogImage: URL;
  description: string;
  navLinks: {
    title: string;
    href: string;
  }[];
  links: {
    twitter: string;
    github: string;
    linkedin: string;
    youtube: string;
  };
};

export const siteConfig: SiteConfig = {
  title: "Nathan's Blog",
  url: "https://nathanroark.com",
  ogImage: new URL("https://nathanroark.com/og.jpg"),
  description: "A log of the music, books, movies, and anime",
  navLinks: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Music",
      href: "/music",
    },
    {
      title: "Books",
      href: "/books",
    },
    {
      title: "Movies",
      href: "/movies",
    },
    {
      title: "Anime",
      href: "/anime",
    },
  ],
  links: {
    twitter: "https://twitter.com/nathanroark",
    github: "https://github.com/nathanroark",
    linkedin: "https://linkedin.com/in/nathan-roark/",
    youtube: "https://youtube.com/@nathanroark",
  },
};
