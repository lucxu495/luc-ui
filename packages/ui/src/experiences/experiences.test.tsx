import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialLinks } from "./social-links";
import { ProfileHero } from "./profile-hero";
import { ExperienceTimeline } from "./experience-timeline";
import { ProjectShowcase } from "./project-showcase";
import { PublicationList } from "./publication-list";
import { ReadingShelf } from "./reading-shelf";
import { NowSection } from "./now-section";

describe("SocialLinks", () => {
  it("warns about the new tab in the accessible name and only for real links", () => {
    render(
      <SocialLinks
        links={[
          { id: "gh", label: "GitHub", href: "https://github.com/ada", handle: "ada" },
          { id: "mail", label: "Email", href: "mailto:ada@example.com", handle: "ada@example.com" },
        ]}
      />,
    );
    const github = screen.getByRole("link", { name: /GitHub, ada — opens in a new tab/ });
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", expect.stringContaining("noreferrer"));

    const mail = screen.getByRole("link", { name: "Email, ada@example.com" });
    expect(mail).not.toHaveAttribute("target");
  });

  it("is a labelled list, not a run of links", () => {
    render(<SocialLinks links={[{ id: "a", label: "GitHub", href: "https://github.com" }]} label="Elsewhere" />);
    expect(screen.getByRole("list", { name: "Elsewhere" })).toBeInTheDocument();
  });
});

describe("ProfileHero", () => {
  it("makes the name the page heading and the facts a definition list", () => {
    render(
      <ProfileHero
        name="Ada Okonkwo"
        title="Distributed systems engineer"
        lead="I build storage layers."
        facts={[{ id: "loc", label: "Based in", value: "Lisbon" }]}
        links={[{ id: "gh", label: "GitHub", href: "https://github.com/ada" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Ada Okonkwo" })).toBeInTheDocument();
    expect(screen.getByText("Based in")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).toBeInTheDocument();
  });
});

describe("ExperienceTimeline", () => {
  const items = [
    {
      id: "now",
      role: "Staff engineer",
      org: "Northwind",
      from: "2023",
      current: true,
      summary: "Storage platform.",
      highlights: ["Cut p99 by half"],
      tags: ["Go", "Raft"],
    },
    { id: "then", role: "Backend engineer", org: "Contoso", from: "2019", to: "2023" },
  ];

  it("renders an ordered list with a machine-readable period", () => {
    const { container } = render(<ExperienceTimeline items={items} />);
    // An ordered list, not a div tree: a career has an order.
    expect(container.querySelector("ol[data-slot='experience-timeline']")).toBeInTheDocument();
    const current = screen.getByText("2023 — Present");
    expect(current.closest("time")).toHaveAttribute("datetime", "2023");
    expect(screen.getByText("2019 — 2023").closest("time")).toHaveAttribute("datetime", "2019/2023");
  });

  it("localises the open end and hides detail in summary density", () => {
    const { rerender } = render(<ExperienceTimeline items={items} density="summary" />);
    expect(screen.queryByText("Cut p99 by half")).not.toBeInTheDocument();
    rerender(<ExperienceTimeline items={items} />);
    expect(screen.getByText("Cut p99 by half")).toBeInTheDocument();
    rerender(<ExperienceTimeline items={items} />);
  });

  it("takes a current label from the caller", () => {
    render(<ExperienceTimeline items={[items[0]!]} />);
    expect(screen.getByText("Present")).toBeInTheDocument();
  });
});

describe("ProjectShowcase", () => {
  const projects = [
    { id: "one", title: "Ledger", summary: "A bookkeeping engine." },
    { id: "two", title: "Atlas", summary: "A map renderer." },
  ];

  it("opens a project in place and closes it again", async () => {
    const user = userEvent.setup();
    render(<ProjectShowcase projects={projects} renderDetail={(p) => <p>Detail of {p.title}</p>} />);
    const ledger = screen.getByRole("button", { name: /Ledger/ });
    expect(ledger).toHaveAttribute("aria-expanded", "false");

    await user.click(ledger);
    expect(ledger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Detail of Ledger")).toBeInTheDocument();

    await user.click(ledger);
    expect(ledger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Detail of Ledger")).not.toBeInTheDocument();
  });

  it("reports the choice to a controlled caller", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ProjectShowcase
        projects={projects}
        value={null}
        onValueChange={onChange}
        renderDetail={(p) => <p>{p.title}</p>}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Atlas/ }));
    expect(onChange).toHaveBeenCalledWith("two");
    // Controlled with no re-render: the panel correctly stays closed.
    expect(screen.queryByRole("region", { name: "Atlas" })).not.toBeInTheDocument();
  });

  it("can open the first project on mount", () => {
    render(
      <ProjectShowcase
        projects={projects}
        defaultOpenFirst
        renderDetail={(p) => <p>Detail of {p.title}</p>}
      />,
    );
    expect(screen.getByText("Detail of Ledger")).toBeInTheDocument();
  });
});

describe("PublicationList", () => {
  const publications = [
    {
      id: "p1",
      title: "Sparse attention for long contexts",
      authors: "A. Okonkwo, R. Silva",
      venue: "Journal of Systems",
      year: 2026,
      kind: "Journal article",
      topics: ["Attention"],
      doi: "10.1000/fictional.1",
    },
    {
      id: "p2",
      title: "A cheaper index",
      authors: "R. Silva",
      venue: "Preprint",
      year: 2025,
      kind: "Preprint",
      topics: ["Indexing"],
    },
    {
      id: "p3",
      title: "Instrumenting a store",
      authors: "A. Okonkwo",
      venue: "SoConf",
      year: 2024,
      kind: "Conference paper",
      topics: ["Indexing"],
    },
  ];

  it("narrows the list by year and reports the count", async () => {
    const user = userEvent.setup();
    render(<PublicationList publications={publications} />);
    expect(screen.getByText("3 of 3")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Year"), "2025");
    expect(screen.getByText("A cheaper index")).toBeInTheDocument();
    expect(screen.queryByText("Sparse attention for long contexts")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("derives the topic facets from the entries", async () => {
    const user = userEvent.setup();
    render(<PublicationList publications={publications} />);
    const topic = screen.getByLabelText("Topic");
    expect(within(topic).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "All topics",
      "Attention",
      "Indexing",
    ]);
    await user.selectOptions(topic, "Indexing");
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
  });

  it("shows the caller's empty wording rather than an empty page", async () => {
    const user = userEvent.setup();
    render(<PublicationList publications={publications} emptyText="Nothing here yet." />);
    await user.selectOptions(screen.getByLabelText("Type"), "Preprint");
    await user.selectOptions(screen.getByLabelText("Year"), "2024");
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("invents no DOI link for an entry that has none", () => {
    render(<PublicationList publications={publications} filters={false} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /DOI 10.1000\/fictional.1/ })).toBeInTheDocument();
  });
});

describe("ReadingShelf", () => {
  const items = [
    {
      id: "b1",
      title: "The Design of Everyday Things",
      author: "Don Norman",
      status: "reading" as const,
      progress: 0.42,
      progressLabel: "p. 142 of 340",
    },
    { id: "b2", title: "Seeing Like a State", author: "James Scott", status: "queued" as const },
  ];

  it("groups by status and exposes progress as a meter", () => {
    render(<ReadingShelf items={items} statusLabels={{ reading: "在读", queued: "待读" }} />);
    expect(screen.getByRole("region", { name: "在读" })).toBeInTheDocument();
    const meter = screen.getByRole("progressbar", { name: /progress/ });
    expect(meter).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText("p. 142 of 340")).toBeInTheDocument();
  });

  it("omits the meter for a book that has no progress", () => {
    render(<ReadingShelf items={items} />);
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
  });
});

describe("NowSection", () => {
  it("prints the date it was true, in UTC so it cannot drift by a day", () => {
    render(
      <NowSection
        updatedAt="2026-03-01"
        updatedLabel="Updated {date}"
        items={[{ id: "a", label: "Building", value: "A storage engine" }]}
      />,
    );
    const time = screen.getByText("Updated March 1, 2026");
    expect(time.closest("time")).toHaveAttribute("datetime", "2026-03-01");
    expect(screen.getByText("Building")).toBeInTheDocument();
  });
});
