# WiiDesktop Launcher

A custom, Electron-based desktop application for Windows that replicates the nostalgic visual experience of the classic Nintendo Wii home screen. Configure and launch your favorite apps, games, and websites by clicking on interactive “channel” tiles.

---

## For Users: How to Install and Use

This is the recommended method for most users. You will download a simple installer and run it just like any other application.

### 1. Download the Latest Release

* Go to the [**Releases Page**](https://github.com/YOUR_USERNAME/WiiDesktopLauncher/releases) on this GitHub repository.
    > *(Note to developer: Replace the URL above with the actual link to your repository's releases page.)*
* Look for the latest version (it will be at the top).
* Under the "Assets" section, click on `WiiDesktopLauncher-Setup-x.x.x.exe` to download the installer.

### 2. Run the Installer

* Once the download is complete, find the `.exe` file in your Downloads folder and double-click it.
* Windows may show a security warning ("Windows protected your PC"). If it does, click **"More info"** and then **"Run anyway"**.
* Follow the on-screen instructions. The application will install and launch automatically.

### 3. Using the App

* **Launch Apps:** Simply click on any channel to launch the configured application or website.
* **Customize Channels (Coming Soon):** Right-click on a channel to open a menu where you can change its title, icon, or the program it launches.
* **Exit the App:** A "Quit" button will be available in the settings menu or via a custom UI button to close the application.

---

## For Developers: Running from Source

If you want to modify the code, add features, or run the app in a development environment, follow these steps.

### Prerequisites

* **Node.js:** You must have Node.js (which includes npm) installed. You can download it from [nodejs.org](https://nodejs.org/).
* **Git:** You must have Git installed for cloning the repository. You can get it from [git-scm.com](https://git-scm.com/).

### 1. Clone the Repository

Open your terminal or command prompt and run the following command to clone the project to your local machine:

```bash
git clone [https://github.com/YOUR_USERNAME/WiiDesktopLauncher.git](https://github.com/YOUR_USERNAME/WiiDesktopLauncher.git)
```
### 2. Navigate to the Project Directory
Bash

cd WiiDesktopLauncher
### 3. Install Dependencies
Install all the necessary project dependencies using npm:

Bash

npm install
### 4. Run the App in Development Mode
This command will launch the application in a live development environment with hot-reloading enabled.

Bash

npm run dev
The application window will appear, and any changes you make to the source code (e.g., in the src folder) will cause the app to update automatically.

### 5. Building the Application (Creating the Installer)
If you want to create the distributable .exe installer for your application, follow these steps.

First, build the React frontend code into a static bundle:

Bash

npm run build
Then, use Electron Forge to package your application and create the installer:

Bash

npm run make
After the process is complete, you will find the finished installer and other packaged files inside the out folder in your project directory.