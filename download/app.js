import {
  html,
  render,
  useState,
  useEffect,
} from "https://unpkg.com/htm/preact/standalone.module.js";

const API_URL = "https://pk7uo1n3r0.execute-api.eu-west-1.amazonaws.com/prod";

function App() {
  const [releases, setReleases] = useState(null);
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
        Please try${" "}
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
      (release) =>
        html`<${Channel} release=${release} key=${release.channel} />`
    );
}

function Channel({ release: { channel, files, changelog, title, updated } }) {
  const [showChangelog, setShowChangelog] = useState(false);

  return html`
    <h3>
      Latest ${channel === "stable" ? "" : `${ucFirst(channel)}-`}Version:
    </h3>
    <div className="downloadWrap">
      <${ChannelWarning} channel=${channel} />
      <p>
        <small>
          Version: <strong>${title}</strong> | Released:
          <strong>${new Date(updated).toLocaleString()}</strong>
        </small>
      </p>
      ${Object.keys(files).map(
        (arch) =>
          html`<a
              href="?channel=${channel}&arch=${arch}"
              key=${files[arch].sha512}
            >
              ⬇ Download for
              ${arch === "arm64"
                ? " ARM/M1 "
                : arch === "x64"
                ? " Intel "
                : " "}
              Macs</a
            ><br />`
      )}
      <button
        className="changelogToggle"
        onClick=${() => setShowChangelog((s) => !s)}
      >
        ${showChangelog ? "▲ Hide" : "▼ Show"} Changelog
      </button>
      ${showChangelog ? html`<${Changelog} changelog=${changelog} />` : null}
    </div>
  `;
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

function Release({ file, date }) {
  return html` 
    <p style="display: flex; align-items: center; margin-bottom: 0">
      <small>sha512:</small>
      <pre style="margin-bottom: 0; font-size: 13px; max-width: 50%; margin-left: 1em;">
        ${file.sha512}
      </pre>
    </p>
    <p>
      <small>
        Released: <strong>${date.toLocaleString()}</strong> |
        Size: <strong>${file.size}</strong>
      </small>
    </p>`;
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

const download = location.search
  .replace(/^\?/, "")
  .split("&")
  .reduce((m, t) => {
    const [key, value] = t.split("=");
    return { ...m, [decodeURIComponent(key)]: decodeURIComponent(value) };
  }, {});

function DownloadApp({ channel, arch = "x64" }) {
  const [release, setRelease] = useState(null);
  useEffect(() => {
    window.location = `${API_URL}/download/${channel}/${arch}`;
    fetch(`${API_URL}/latest/${channel}`)
      .then((res) => {
        if (res.status !== 200) {
          throw new Error(`Request failed (${res.status})`);
        }
        return res.json();
      })
      .then(setRelease)
      .catch(setRelease);
  }, []);

  if (release === null) {
    return html`<p>Looking for latest ${channel} version...</p>`;
  }

  if (release instanceof Error || !release.files[arch]) {
    return html`
      <p>
        Sorry Could not load latest release.
        <br />
        Please try${" "}
        <a href="https://github.com/Xiphe/budgetbudget/releases/">
          Releases page on GitHub
        </a>
      </p>
      <p>
        <small>Reason: ${release.message}</small>
      </p>
    `;
  }

  const date = new Date(release.updated);
  const file = release.files[arch];

  return html`
    <h3>Downloading BudgetBudget ${release.title}</h3>
    <${Release} file=${file} date=${date} />
    <p>
      <a href=${file.download}
        >Click here if download does not start automatically.</a
      >
    </p>
    <${Changelog} changelog=${release.changelog} />
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const elm = document.getElementById("downloadRoot");
  elm.innerHTML = "";
  if (download.channel) {
    render(
      html`<${DownloadApp}
        channel=${download.channel}
        arch=${download.arch}
      />`,
      elm
    );
  } else {
    render(html`<${App} />`, elm);
  }
});
