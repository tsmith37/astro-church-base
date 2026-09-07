import CMS from 'decap-cms-app';
import { parse as parseYaml } from 'yaml';

const isDev = import.meta.env.DEV;
const backendName = import.meta.env.PUBLIC_CMS_BACKEND ?? 'github';
const githubAppId = import.meta.env.PUBLIC_GITHUB_APP_ID ?? '';

// Phase A uses GitHub PKCE (PUBLIC_GITHUB_APP_ID). If that login flow fails on
// Netlify, add an OAuth Function and set backend.base_url to the site origin.

function getBackend() {
  if (isDev) {
    return { name: 'git-gateway', branch: 'main' };
  }

  if (backendName === 'git-gateway') {
    return { name: 'git-gateway', branch: 'main' };
  }

  return {
    name: 'github',
    repo: 'tsmith37/astro-church-base',
    branch: 'main',
    auth_type: 'pkce',
    app_id: githubAppId,
  };
}

async function loadFileConfig() {
  const response = await fetch('/admin/config.yml', { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Failed to load /admin/config.yml (${response.status})`);
  }
  return parseYaml(await response.text()) as Record<string, unknown>;
}

async function initCms() {
  const fileConfig = await loadFileConfig();

  CMS.init({
    config: {
      ...fileConfig,
      load_config_file: false,
      local_backend: isDev,
      publish_mode: isDev ? 'simple' : 'editorial_workflow',
      backend: getBackend(),
    },
  });
}

void initCms();
