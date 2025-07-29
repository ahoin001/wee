// GitHub Preset Sharing Configuration
// Replace these values with your actual GitHub details

export const GITHUB_CONFIG = {
  // Your GitHub Personal Access Token
  // Get this from: https://github.com/settings/tokens
  // Replace this with your actual token from Step 2
  TOKEN: 'your_github_token_here',
  
  // Your repository in format: username/repository-name
  // Replace 'ahoin001' with your GitHub username
  // Replace 'wii-presets' with your repository name
  REPO: 'your_username/wii-presets',
  
  // Branch to store presets (usually 'main' or 'master')
  BRANCH: 'main',
  
  // API endpoints
  API_BASE: 'https://api.github.com',
  CONTENTS_URL: 'https://api.github.com/repos/ahoin001/wii-presets/contents',
  
  // Rate limiting (GitHub allows 5000 requests per hour for authenticated users)
  RATE_LIMIT: {
    REQUESTS_PER_HOUR: 5000,
    UPLOAD_COOLDOWN: 60000 // 1 minute between uploads
  }
};

// Helper function to get full API URL
export const getGitHubApiUrl = (path = '') => {
  return `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.REPO}/${path}`;
};

// Helper function to get contents URL
export const getContentsUrl = () => {
  return getGitHubApiUrl('contents');
};

// Helper function to get file URL
export const getFileUrl = (filename) => {
  return getGitHubApiUrl(`contents/${filename}`);
};

// Test function to verify GitHub configuration
export const testGitHubConnection = async () => {
  try {
    console.log('Testing GitHub connection...');
    console.log('Repository:', GITHUB_CONFIG.REPO);
    console.log('Token configured:', GITHUB_CONFIG.TOKEN !== 'your_github_token_here');
    
    const response = await fetch(getContentsUrl(), {
      headers: {
        'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
        'User-Agent': 'WiiDesktop-Launcher'
      }
    });
    
    if (response.ok) {
      console.log('✅ GitHub connection successful!');
      return { success: true, message: 'GitHub connection working' };
    } else {
      const error = await response.json();
      console.error('❌ GitHub connection failed:', error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('❌ GitHub connection exception:', error);
    return { success: false, error: error.message };
  }
}; 