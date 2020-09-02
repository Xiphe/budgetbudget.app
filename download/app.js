import {
  html,
  render,
  useState,
  useEffect,
} from "https://unpkg.com/htm/preact/standalone.module.js";

const API_URL = "https://pk7uo1n3r0.execute-api.eu-west-1.amazonaws.com/prod";

function App() {
  const [releases, setReleases] = useState(null);
  const [showChangelog, setShowChangelog] = useState(false);
  useEffect(() => {
    fetch(`${API_URL}/latest?channels=stable,beta,alpha`)
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
    return html`<p>Looking for latest versions...</p>`;
  }

  if (releases instanceof Error) {
    return html`
      <p>
        Sorry Could not load latest releases.
        <br />
        Please try
        <a href="https://github.com/Xiphe/budgetbudget/releases/">
          Releases page on GitHub
        </a>
      </p>
      <p>
        <small>Reason: ${releases.message}</small>
      </p>
    `;
  }

  return ["stable", "beta", "alpha"]
    .map((r) => releases[r])
    .filter(Boolean)
    .map(
      ({ channel, download, title, changelog }) => html`
        <div key=${channel}>
          <h3>
            Latest ${channel === "stable" ? "" : `${ucFirst(channel)}-`}Version:
          </h3>
          <div className="downloadWrap">
            <${ChannelWarning} channel=${channel} />
            <h4>
              <a href=${download}>⬇ Download ${title}</a>
              <button
                className="changelogToggle"
                onClick=${() => setShowChangelog((s) => !s)}
              >
                ${showChangelog ? "▲ Hide" : "▼ Show"} Changelog
              </button>
            </h4>
            ${showChangelog
              ? html`<${Changelog} changelog=${changelog} />`
              : null}
          </div>
        </div>
      `
    );
}

function Changelog({ changelog }) {
  return Object.entries(changelog).map(
    ([type, entries]) => html`
      <div key=${type}>
        <h4>${type}</h4>
        ${Object.entries(entries).map(
          ([scope, changes]) => html`
            <h5>${scope === "_" ? "General" : scope}</h5>
            <ul>
              ${changes.map(
                ({ message, commit }) => html`
                  <li key=${commit}>${message}</li>
                `
              )}
            </ul>
          `
        )}
      </div>
    `
  );
}

function Warning({ children }) {
  return html`
    <div className="warning">
      <h3>⚠️ Warning</h3>
      ${children}
    </div>
    <br />
  `;
}

function ChannelWarning({ channel }) {
  switch (channel) {
    case "stable":
      return null;
    case "beta":
      return html`
        <${Warning}>
          <p>Beta releases are untested and may contain bugs or be instable.</p>
          <p>Use at your own risk and backup your budgets.</p>
        <//>
      `;
    case "alpha":
      return html`
        <${Warning}>
          <p>
            Alpha releases are unstable, untested and may damage your budget
            files.
          </p>
          <p>Use at your own risk and definitely backup your budgets.</p>
        <//>
      `;
  }
}

function ucFirst(str) {
  return `${str[0].toUpperCase()}${str.substring(1)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const elm = document.getElementById("downloadRoot");
  elm.innerHTML = "";
  render(html`<${App} />`, elm);
});
