import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import BlogPost from "./BlogPost";

vi.mock("../components/Footer", () => ({ default: () => <footer>Footer</footer> }));

const oldImage = "https://cdn.example.test/blog-cover-old.jpg";
const newImage = "https://cdn.example.test/blog-cover-new.jpg";

const reactTestGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

beforeAll(() => {
  reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = false;
});

function article(heroImage: string) {
  return {
    id: "article-1",
    slug: "test-cover",
    title: "Test cover",
    description: "Blog cover refresh test",
    category: "Journal",
    author: "Tester",
    date: "2026-08-08",
    readTime: "1 phút",
    image: heroImage,
    heroImage,
    sections: [{ heading: "Section", body: "Content" }],
    relatedSlugs: [],
  };
}

async function renderPost(container: HTMLElement) {
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <MemoryRouter
        initialEntries={["/blog/test-cover"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return root;
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("blog cover refresh", () => {
  let container: HTMLDivElement;
  let root: Root | undefined;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    Object.defineProperty(window, "scrollTo", { value: vi.fn(), configurable: true });
  });

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount());
    }
    container.remove();
    vi.restoreAllMocks();
  });

  it("keeps the loaded cover while the page stays open and fetches the new cover after remount", async () => {
    let serverArticle = article(oldImage);
    const get = vi.spyOn(api, "get").mockImplementation(
      async () =>
        ({
          data: { data: serverArticle },
        }) as any,
    );

    root = await renderPost(container);
    await flushEffects();

    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelector(`img[src="${oldImage}"]`)).not.toBeNull();

    // Simulate the admin saving a new Cloudinary URL while this user keeps the page open.
    serverArticle = article(newImage);
    await act(async () => {
      root?.render(
        <MemoryRouter
          initialEntries={["/blog/test-cover"]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(get).toHaveBeenCalledTimes(1);
    expect(container.querySelector(`img[src="${oldImage}"]`)).not.toBeNull();
    expect(container.querySelector(`img[src="${newImage}"]`)).toBeNull();

    await act(async () => root?.unmount());
    root = undefined;
    container.remove();
    container = document.createElement("div");
    document.body.appendChild(container);

    root = await renderPost(container);
    await flushEffects();

    expect(get).toHaveBeenCalledTimes(2);
    expect(container.querySelector(`img[src="${newImage}"]`)).not.toBeNull();
  });
});
