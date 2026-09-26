import type { MetadataRoute } from "next";

// This is an internal university tool, not a public site — there's nothing
// here search engines should ever index (student names, marks, etc. would
// otherwise be one Google search away from anyone). Disallow everything.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
