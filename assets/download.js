document.addEventListener("DOMContentLoaded", (event) => {
  const { render } = ReactDOM;
  const { createElement: $, useState, useEffect, Fragment } = React;

  function Changelog({ changelog }) {
    const [show, setShow] = useState(false);

    return [
      $(
        "button",
        {
          onClick() {
            setShow((p) => !p);
          },
        },
        `${show ? "Hide" : "Show"} Changelog`
      ),
      show
        ? Object.entries(changelog).map(([type, entries]) =>
            $("div", { key: type }, [
              $("h4", {}, type),
              Object.entries(entries).map(([scope, changes]) =>
                $(Fragment, { key: scope }, [
                  scope === "_" ? null : $("h5", {}, scope),
                  $(
                    "ul",
                    {},
                    changes.map(({ message, commit }) =>
                      $("li", { key: commit }, message)
                    )
                  ),
                ])
              ),
            ])
          )
        : null,
    ];
  }

  function ChannelWarning({ channel }) {
    switch (channel) {
      case "stable":
        return null;
      case "beta":
        return $("div", { className: "warning" }, [
          $("h3", {}, "Warning"),
          $(
            "p",
            {},
            "Beta releases are untested and may contain bugs or be instable."
          ),
          $("p", {}, "Use at your own risk and backup your budgets."),
        ]);
      case "alpha":
        return $("div", { className: "warning" }, [
          $("h3", {}, "Warning"),
          $(
            "p",
            {},
            "Alpha releases are unstable, untested and may damage your budget files."
          ),
          $(
            "p",
            {},
            "Use at your own risk and definitely backup your budgets."
          ),
        ]);
    }
  }

  function App() {
    const [releases, setReleases] = useState(null);
    useEffect(() => {
      fetch(
        "https://pk7uo1n3r0.execute-api.eu-west-1.amazonaws.com/prod/latest?channels=stable,beta,alpha"
      )
        .then((res) => {
          if (res.status !== 200) {
            throw new Error(`Request failed (${res.status})`);
          }
          return res.json();
        })
        .then(setReleases)
        .catch((err) => setReleases(err));
    }, []);

    if (releases === null) {
      return $("p", {}, "Looking for latest versions...");
    }

    if (releases instanceof Error) {
      return [
        $("p", {}, [
          "Sorry Could not load latest releases.",
          $("br"),
          "Please try ",
          $(
            "a",
            { href: "https://github.com/Xiphe/budgetbudget/releases/" },
            "Releases page on GitHub"
          ),
        ]),
        $("p", {}, [$("small", {}, ["Reason: ", releases.message])]),
      ];
    }

    return ["stable", "beta", "alpha"].map((channel) =>
      $(
        "div",
        { key: channel },
        !releases[channel]
          ? null
          : [
              $(
                "h3",
                {},
                `Latest ${
                  channel === "stable"
                    ? ""
                    : `${channel[0].toUpperCase()}${channel.substring(1)}-`
                }Version:`
              ),
              $(
                "h4",
                {},
                $(
                  "a",
                  { href: releases[channel].download },
                  `Download ${releases[channel].title}`
                )
              ),
              $(ChannelWarning, { channel }),
              $(Changelog, {
                changelog: releases[channel].changelog,
              }),
            ]
      )
    );
  }

  render($(App), document.getElementById("downloadRoot"));
});
