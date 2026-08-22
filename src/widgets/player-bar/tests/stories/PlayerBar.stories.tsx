import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { PlayerBar, type PlayerBarTrack } from "../../";

const queue: PlayerBarTrack[] = [
  { id: "1", title: "Ты та...", artist: "Баста" },
  { id: "2", title: "Not Alone", artist: "FaderX" },
  { id: "3", title: "Horizon", artist: "Sick Individuals" },
];

function PlayerBarHarness({
  initialTrack = queue[0]!,
  initialQueue = queue,
}: {
  initialTrack?: PlayerBarTrack;
  initialQueue?: PlayerBarTrack[];
}) {
  const [track, setTrack] = useState(initialTrack);
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return (
      <div className="p-9 text-sm" style={{ color: "#6b7280" }}>
        Плеер скрыт
      </div>
    );
  }

  return (
    <div
      className="relative min-h-[240px] pt-[100px]"
      style={{ background: "#fafafa" }}
    >
      <p className="px-9 text-sm" style={{ color: "#6b7280" }}>
        Очередь: {initialQueue.map((item) => item.title).join(" · ")}
      </p>
      <PlayerBar
        track={track}
        queue={initialQueue}
        onTrackChange={setTrack}
        onDismiss={() => setVisible(false)}
      />
    </div>
  );
}

const meta = {
  title: "Widgets/PlayerBar/PlayerBar",
  component: PlayerBar,
  args: {
    track: queue[0]!,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PlayerBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <PlayerBarHarness />,
};

export const PlayPause: Story = {
  render: () => <PlayerBarHarness />,
  play: async ({ canvasElement }) => {
    const media =
      canvasElement.ownerDocument.defaultView!.HTMLMediaElement.prototype;
    media.play = async () => undefined;
    media.pause = () => undefined;

    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole("button", {
      name: /^(Пауза|Воспроизвести)$/,
    });
    const initial = toggle.getAttribute("aria-label");
    const flipped = initial === "Пауза" ? "Воспроизвести" : "Пауза";

    await userEvent.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-label", flipped);
    });

    await userEvent.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-label", initial);
    });
  },
};

export const NextPreviousInQueue: Story = {
  render: () => <PlayerBarHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Следующий трек" }),
    );
    await waitFor(() => {
      expect(canvas.getByText("Not Alone")).toBeInTheDocument();
      expect(canvas.getByText("FaderX")).toBeInTheDocument();
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Предыдущий трек" }),
    );
    await waitFor(() => {
      expect(canvas.getByText("Ты та...")).toBeInTheDocument();
      expect(canvas.getByText("Баста")).toBeInTheDocument();
    });
  },
};

export const ToggleShuffleAndRepeat: Story = {
  render: () => <PlayerBarHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shuffle = await canvas.findByRole("button", { name: "Перемешать" });
    const repeat = canvas.getByRole("button", { name: "Повторить" });

    await userEvent.click(shuffle);
    expect(shuffle).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(repeat);
    expect(repeat).toHaveAttribute("aria-pressed", "true");
  },
};

export const DismissByDragHandle: Story = {
  render: () => <PlayerBarHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = await canvas.findByRole("separator", {
      name: "Скрыть плеер — потяните границу вниз",
    });

    await userEvent.pointer([
      {
        keys: "[MouseLeft>]",
        target: handle,
        coords: { clientX: 40, clientY: 20 },
      },
      { coords: { clientX: 40, clientY: 120 } },
      { keys: "[/MouseLeft]" },
    ]);

    await waitFor(() => {
      expect(canvas.getByText("Плеер скрыт")).toBeInTheDocument();
    });
  },
};

export const AdjustVolume: Story = {
  render: () => <PlayerBarHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = await canvas.findByRole("slider", { name: "Громкость" });
    expect(slider).toHaveAttribute("aria-valuenow", "50");

    slider.focus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    await waitFor(() => {
      expect(slider).toHaveAttribute("aria-valuenow", "47");
    });

    await userEvent.keyboard("{End}");
    await waitFor(() => {
      expect(slider).toHaveAttribute("aria-valuenow", "100");
    });

    await userEvent.keyboard("{Home}");
    await waitFor(() => {
      expect(slider).toHaveAttribute("aria-valuenow", "0");
    });
  },
};

async function setPreviewWidth(canvasElement: HTMLElement, widthPx: number) {
  const view = canvasElement.ownerDocument.defaultView;
  const iframe = view?.frameElement as HTMLIFrameElement | null;
  if (iframe) {
    iframe.style.width = `${widthPx}px`;
  }
  await new Promise<void>((resolve) => {
    view?.requestAnimationFrame(() => resolve());
  });
}

export const MobileVolumeMenu: Story = {
  render: () => <PlayerBarHarness />,
  globals: {
    viewport: { value: "mobile1", isRotated: false },
  },
  play: async ({ canvasElement }) => {
    // Tailwind `md:` смотрит на ширину iframe, не на декоратор.
    await setPreviewWidth(canvasElement, 375);

    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    const trigger = await canvas.findByRole("button", { name: "Громкость" });
    await userEvent.click(trigger);

    const vertical = await waitFor(() => {
      const found = page
        .getAllByRole("slider", { name: "Громкость" })
        .find((el) => el.getAttribute("aria-orientation") === "vertical");
      expect(found).toBeTruthy();
      return found!;
    });

    vertical.focus();
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    await waitFor(() => {
      expect(vertical).toHaveAttribute("aria-valuenow", "53");
    });
  },
};
