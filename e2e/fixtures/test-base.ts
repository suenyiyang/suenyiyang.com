import { test as base } from "@playwright/test";
import { HomePage } from "./pages/home-page";
import { PostsPage } from "./pages/posts-page";
import { PostDetailPage } from "./pages/post-detail-page";
import { LinksPage } from "./pages/links-page";

type Fixtures = {
  homePage: HomePage;
  postsPage: PostsPage;
  postDetailPage: PostDetailPage;
  linksPage: LinksPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  postsPage: async ({ page }, use) => {
    await use(new PostsPage(page));
  },
  postDetailPage: async ({ page }, use) => {
    await use(new PostDetailPage(page));
  },
  linksPage: async ({ page }, use) => {
    await use(new LinksPage(page));
  },
});

export { expect } from "@playwright/test";
