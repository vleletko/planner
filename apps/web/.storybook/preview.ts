import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { sb } from "storybook/test";

import "../src/index.css";

// Create a new QueryClient for each story to ensure isolation
const withQueryClient: Decorator = (Story) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in Storybook
      },
    },
  });
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(Story)
  );
};

// Mock auth client - uses __mocks__/auth-client.ts automatically
sb.mock(import("../src/lib/auth-client.ts"));

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
    nextjs: {
      appDirectory: true,
    },
    viewport: {
      viewports: {
        mobile1: {
          name: "Mobile (320px)",
          styles: { width: "320px", height: "568px" },
        },
        mobile2: {
          name: "Mobile Large (414px)",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet (768px)",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop (1280px)",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
  initialGlobals: {
    viewport: { value: "desktop" },
  },
  decorators: [
    withQueryClient,
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
