import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";

import { createTestProviders } from "../src/shared/tests";
import "../src/app/styles/index.css";

initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
  decorators: [
    (Story, context) =>
      createTestProviders({
        children: <Story />,
        initialEntry:
          typeof context.parameters.initialEntry === "string"
            ? context.parameters.initialEntry
            : "/",
      }),
  ],
  loaders: [mswLoader],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
