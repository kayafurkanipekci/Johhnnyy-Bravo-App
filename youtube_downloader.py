import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from tkinter import filedialog
import yt_dlp
import threading
import os 
import sys # Added for icon path

# Import ICON_NAME from main.py config
try:
    from main import ICON_NAME
except ImportError:
    ICON_NAME = "favicon.ico" # Fallback

class YouTubeDownloader(ttk.Toplevel):
    """
    Toplevel window for downloading YouTube media (video or audio).
    """
    def __init__(self, main_app):
        super().__init__(main_app)
        self.main_app = main_app
        self.title("YouTube Media Downloader")
        
        self.geometry("500x750") # Height increased to 750px
        self.center_window(500, 750)
        self.resizable(False, False)
        
        self.cookie_file_path = None
        self.is_closing = False # Flag to stop threads
        
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
        """Creates and places all widgets in the downloader window."""
        main_frame = ttk.Frame(self, padding="20")
        main_frame.pack(expand=True, fill="both")

        label_header = ttk.Label(main_frame, text="YouTube Downloader", 
                                  bootstyle="primary", font=("Segoe UI", 16, "bold"), 
                                  anchor="center")
        label_header.pack(pady=10, fill="x")

        label_url = ttk.Label(main_frame, text="Video URL:")
        label_url.pack(pady=5, anchor="w")

        self.entry_url = ttk.Entry(main_frame, width=60)
        self.entry_url.pack(pady=5, fill="x")

        # --- Download Type (Video/Audio) ---
        self.type_frame = ttk.Labelframe(main_frame, text="Download Type", padding=10)
        self.type_frame.pack(pady=10, fill="x")
        
        self.download_type = ttk.StringVar(value="video")
        
        video_audio_frame = ttk.Frame(self.type_frame, bootstyle="secondary")
        video_audio_frame.pack(fill="x", expand=True)

        radio_video = ttk.Radiobutton(video_audio_frame, text="Video", 
                                      variable=self.download_type, value="video", 
                                      command=self.toggle_resolution_frame,
                                      bootstyle="toolbutton")
        radio_video.pack(side="left", padx=0, pady=0, fill="x", expand=True)

        radio_audio = ttk.Radiobutton(video_audio_frame, text="Audio (MP3)", 
                                      variable=self.download_type, value="audio", 
                                      command=self.toggle_resolution_frame,
                                      bootstyle="toolbutton")
        radio_audio.pack(side="left", padx=0, pady=0, fill="x", expand=True)

        # --- Resolution Selection ---
        self.resolution_frame = ttk.Labelframe(main_frame, text="Resolution", padding=10)
        # We pack this later in toggle_resolution_frame() to fix the layout bug
        
        self.resolution_var = ttk.StringVar(value="1080")
        
        res_frame_inner = ttk.Frame(self.resolution_frame, bootstyle="secondary")
        res_frame_inner.pack(fill="x", expand=True)
        
        resolutions = [("Best", "best"), ("1080p", "1080"), ("720p", "720"), ("480p", "480")]
        for text, value in resolutions:
            ttk.Radiobutton(res_frame_inner, text=text, 
                            variable=self.resolution_var, value=value,
                            bootstyle="toolbutton").pack(side="left", padx=0, pady=0, fill="x", expand=True)

        # --- Cookie Loading ---
        cookie_frame = ttk.Labelframe(main_frame, text="Bot Prevention (Recommended)", padding=10)
        cookie_frame.pack(pady=10, fill="x")

        self.cookie_status_label = ttk.Label(cookie_frame, text="Status: No cookies loaded.", bootstyle="warning")
        self.cookie_status_label.pack(side="left", padx=5, expand=True)

        cookie_button = ttk.Button(cookie_frame, text="Load Cookies.txt", 
                                     command=self.load_cookie_file, 
                                     bootstyle="info-outline")
        cookie_button.pack(side="right", padx=5)

        # --- Download Progress Feedback ---
        feedback_frame = ttk.Labelframe(main_frame, text="Download Progress", padding=10)
        feedback_frame.pack(pady=10, fill="x")

        self.status_label = ttk.Label(feedback_frame, text="Waiting for download...", anchor="center")
        self.status_label.pack(pady=5, fill="x")
        
        self.progress_bar = ttk.Progressbar(feedback_frame, orient='horizontal', 
                                            mode='determinate', 
                                            bootstyle="success-striped")
        self.progress_bar.pack(pady=10, fill="x")

        # --- Action Buttons ---
        download_button = ttk.Button(main_frame, text="Download", 
                                     command=self.start_download_thread, 
                                     bootstyle="primary", padding=10)
        download_button.pack(pady=10, fill="x")

        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10, fill="x")

        back_button = ttk.Button(button_frame, text="Back", command=self.go_back, bootstyle="secondary-outline")
        back_button.pack(side="left", expand=True, padx=5)

        exit_button = ttk.Button(button_frame, text="Exit App", command=self.exit_app, bootstyle="danger")
        exit_button.pack(side="left", expand=True, padx=5)

        # Initial call to set the correct UI state
        self.toggle_resolution_frame()

    def toggle_resolution_frame(self):
        """Shows or hides the resolution selection frame based on download type."""
        if self.download_type.get() == "video":
            # Fixed layout bug: pack 'after' the type_frame to maintain order
            self.resolution_frame.pack(pady=10, fill="x", after=self.type_frame)
        else:
            self.resolution_frame.pack_forget()

    def load_cookie_file(self):
        """Opens a dialog to load a cookies.txt file."""
        file_path = filedialog.askopenfilename(
            title="Select cookies.txt file",
            filetypes=[("Text Files", "*.txt")]
        )
        if file_path:
            self.cookie_file_path = file_path
            file_name = os.path.basename(file_path) 
            self.cookie_status_label.config(text=f"Active: {file_name}", bootstyle="success")
            self.update_status_safe(f"Cookie file loaded: {file_name}", "success")
        else:
            self.cookie_file_path = None
            self.cookie_status_label.config(text="Status: No cookies loaded.", bootstyle="warning")

    def on_progress(self, d):
        """Progress hook for yt-dlp to update the UI."""
        if self.is_closing: # Stop processing if window is closing
            raise yt_dlp.utils.DownloadError("Download cancelled by user.")

        if d['status'] == 'downloading':
            total_bytes_str = d.get('total_bytes') or d.get('total_bytes_estimate')
            if total_bytes_str:
                total_bytes = int(total_bytes_str)
                downloaded_bytes = int(d.get('downloaded_bytes'))
                percent = (downloaded_bytes / total_bytes) * 100
                self.progress_bar['value'] = percent
            
            percent_str = d.get('_percent_str', '...').strip()
            speed_str = d.get('_speed_str', '...').strip()
            eta_str = d.get('_eta_str', '...').strip()
            
            status_message = f"Downloading: {percent_str} | Speed: {speed_str} | ETA: {eta_str}"
            self.update_status_safe(status_message, "info")

        elif d['status'] == 'finished':
            self.progress_bar['value'] = 100
            self.update_status_safe("Download finished. Finalizing (merging)...", "info")

    def update_status_safe(self, message, style="success"):
        """Safely updates the status label from the download thread."""
        if self.is_closing:
            return
        try:
            self.after(0, lambda: self.status_label.config(text=message, bootstyle=style))
        except Exception as e:
            # This can happen if the window is destroyed
            print(f"UI update error (safe): {e}")

    def start_download_thread(self):
        """Starts the download process in a separate thread."""
        if self.is_closing: return
        
        self.update_status_safe("Starting download...", style="info")
        self.progress_bar['value'] = 0
        self.progress_bar.config(bootstyle="success-striped")
        
        download_thread = threading.Thread(target=self.download_media, daemon=True)
        download_thread.start()

    def download_media(self):
        """The core download logic that runs in a thread."""
        youtube_url = self.entry_url.get()
        if not youtube_url:
            self.update_status_safe("Please enter a URL", style="danger")
            return

        output_dir = filedialog.askdirectory(title="Select Download Directory")
        if not output_dir:
            self.update_status_safe("Download cancelled", style="warning")
            return

        download_type = self.download_type.get()
        
        try:
            if download_type == "video":
                resolution = self.resolution_var.get()
                if resolution == "best":
                    format_string = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
                else:
                    format_string = f"bestvideo[height<={resolution}][ext=mp4]+bestaudio[ext=m4a]/best[height<={resolution}][ext=mp4]/best"
                
                ydl_opts = {
                    'format': format_string,
                    'outtmpl': f'{output_dir}/%(title)s.%(ext)s',
                    'merge_output_format': 'mp4',
                    'progress_hooks': [self.on_progress],
                }
            else: # Audio
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': f'{output_dir}/%(title)s.mp3', # Force .mp3 extension
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    }],
                    'progress_hooks': [self.on_progress],
                }

            if self.cookie_file_path:
                ydl_opts['cookiefile'] = self.cookie_file_path

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([youtube_url])
            
            if self.is_closing: return
            self.update_status_safe("Download Successful!", style="success")
            self.progress_bar['value'] = 100
        
        except Exception as e:
            if self.is_closing: return # Don't show error if user just closed the window
            
            print(f"Download Error: {e}")
            error_message = str(e)
            
            self.progress_bar['value'] = 100
            self.progress_bar.config(bootstyle="danger-striped")

            if "This video is unavailable" in error_message:
                self.update_status_safe("Error: Video is unavailable", style="danger")
            elif "Sign in" in error_message:
                 self.update_status_safe("ERROR: YouTube 'Bot' Block! Use 'Load Cookies.txt'.", style="danger")
            else:
                # Get the first line of the error, clean it
                clean_error = error_message.splitlines()[0].replace('ERROR: ', '')
                self.update_status_safe(f"Error: {clean_error}", style="danger")

    def go_back(self):
        """Closes this window and shows the main menu."""
        self.close_window() 
        self.main_app.show_main_window(None) # Pass None, as we destroyed it

    def close_window(self):
        """Safely closes the window and sets the closing flag."""
        self.is_closing = True 
        self.destroy() 

    def exit_app(self):
        """Exits the entire application."""
        self.is_closing = True 
        self.main_app.exit_app()