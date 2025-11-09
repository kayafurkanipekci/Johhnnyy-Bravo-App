import ttkbootstrap as ttk
from ttkbootstrap.constants import *
import threading
import subprocess
import sys
import os # Added for icon path

# --- Application Configuration ---
APP_NAME = "Johnny Bravo Media Tools"
APP_GEOMETRY = "400x350"
ICON_NAME = "favicon.ico"

class MainApplication(ttk.Window):
    """
    The main application window that serves as the entry point and menu.
    """
    def __init__(self):
        super().__init__(themename="darkly", title=APP_NAME)
        
        width, height = [int(d) for d in APP_GEOMETRY.split('x')]
        self.geometry(APP_GEOMETRY)
        self.center_window(width, height)
        self.resizable(False, False)
        self.set_app_icon()

        self.create_widgets()
    
    def set_app_icon(self):
        """Sets the application icon for the window."""
        try:
            # Get the absolute path to the icon file
            base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
            icon_path = os.path.join(base_path, ICON_NAME)
            
            if os.path.exists(icon_path):
                self.iconbitmap(icon_path)
            else:
                print(f"Warning: Icon file not found at {icon_path}")
        except Exception as e:
            print(f"Error setting icon: {e}")

    def center_window(self, width, height):
        """Centers the window on the screen."""
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        x_coordinate = (screen_width / 2) - (width / 2)
        y_coordinate = (screen_height / 2) - (height / 2)
        self.geometry(f"{width}x{height}+{int(x_coordinate)}+{int(y_coordinate)}")
    
    def create_widgets(self):
        """Creates and places all widgets in the main window."""
        main_frame = ttk.Frame(self, padding="20")
        main_frame.pack(expand=True, fill="both")

        label = ttk.Label(main_frame, text=APP_NAME, 
                          bootstyle="primary", 
                          font=("Segoe UI", 18, "bold"), anchor="center")
        label.pack(pady=10, fill="x")
        
        youtube_button = ttk.Button(main_frame, text="YouTube Downloader", 
                                    command=self.open_youtube_downloader, 
                                    bootstyle="primary", padding=10)
        youtube_button.pack(pady=10, fill="x")

        file_converter_button = ttk.Button(main_frame, text="File Converter", 
                                           command=self.open_file_converter, 
                                           bootstyle="success", padding=10)
        file_converter_button.pack(pady=10, fill="x")

        update_button = ttk.Button(main_frame, text="Update yt-dlp", 
                                   command=self.start_update_thread, 
                                   bootstyle="info-outline", padding=10)
        update_button.pack(pady=10, fill="x")
        
        self.update_label = ttk.Label(main_frame, text="", anchor="center", font=("Segoe UI", 9), wraplength=350)
        self.update_label.pack(pady=5)

        exit_button = ttk.Button(main_frame, text="Exit", 
                                 command=self.exit_app, 
                                 bootstyle="danger", padding=10)
        exit_button.pack(pady=10, fill="x")

    def open_youtube_downloader(self):
        """Hides the main window and opens the YouTubeDownloader window."""
        self.withdraw()
        try:
            from youtube_downloader import YouTubeDownloader
            youtube_app = YouTubeDownloader(self) 
            youtube_app.protocol("WM_DELETE_WINDOW", lambda: self.show_main_window(youtube_app))
        except Exception as e:
            error_msg = f"Error (Downloader): {type(e).__name__}: {e}"
            print(error_msg)
            self.update_label.config(text=error_msg, bootstyle="danger")
            self.show_main_window(None)

    def open_file_converter(self):
        """Hides the main window and opens the FileConverter window."""
        self.withdraw()
        try:
            from file_converter import FileConverter
            file_converter_app = FileConverter(self)
            file_converter_app.protocol("WM_DELETE_WINDOW", lambda: self.show_main_window(file_converter_app))
        except Exception as e:
            error_msg = f"Error (Converter): {type(e).__name__}: {e}"
            print(error_msg)
            self.update_label.config(text=error_msg, bootstyle="danger")
            self.show_main_window(None)

    def show_main_window(self, window_to_destroy=None):
        """Shows the main window again and destroys the child window."""
        if window_to_destroy:
            # Ensure child window cleanup logic runs
            if hasattr(window_to_destroy, 'close_window'):
                window_to_destroy.close_window()
            else:
                window_to_destroy.destroy()
        self.deiconify() # Show the main window
    
    def exit_app(self):
        """Closes the application."""
        self.quit()
        self.destroy()

    # --- yt-dlp Updater ---

    def update_status_safe(self, message, style="success"):
        """Safely updates the status label from any thread."""
        try:
            self.after(0, lambda: self.update_label.config(text=message, bootstyle=style))
        except Exception as e:
            print(f"UI update error: {e}")

    def start_update_thread(self):
        """Starts the yt-dlp update process in a separate thread."""
        self.update_status_safe("Checking for updates...", style="info")
        update_thread = threading.Thread(target=self.run_update, daemon=True)
        update_thread.start()

    def run_update(self):
        """Runs the 'pip install --upgrade yt-dlp' command."""
        try:
            # Ensure we use the Python executable that's running the script
            subprocess.check_output([sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"], 
                                    stderr=subprocess.STDOUT)
            self.update_status_safe("yt-dlp is up to date!", style="success")
        except subprocess.CalledProcessError as e:
            output = e.output.decode().splitlines()[-1] # Get the last line of the error
            self.update_status_safe(f"Update failed: {output}", style="danger")
        except Exception as e:
            self.update_status_safe(f"Error: {e}", style="danger")
        
        # Clear the message after 5 seconds
        self.after(5000, lambda: self.update_label.config(text=""))
        
if __name__ == "__main__":
    app = MainApplication()
    app.mainloop()