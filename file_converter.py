import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from tkinter import filedialog
import threading
import os
import sys

# --- Library Change ---
# Using 'ffmpeg-python' instead of moviepy/pydub for stability.
# Requires: pip install ffmpeg-python
# IMPORTANT: Requires 'ffmpeg.exe' to be installed on the system.

LIBS_OK = True
try:
    import ffmpeg
except ImportError:
    print("ERROR: 'ffmpeg-python' library not found.")
    print("Please run: pip install ffmpeg-python")
    LIBS_OK = False
except Exception as e:
    LIBS_OK = False
    print(f"Unexpected library error: {e}")

FFMPEG_ERROR_MESSAGE = """ERROR: 'ffmpeg-python' library or 'ffmpeg.exe' not found.
1. Run: pip install ffmpeg-python
2. Ensure 'ffmpeg' is installed on your system (e.g., via scoop or choco)."""

# Import ICON_NAME from main.py config
try:
    from main import ICON_NAME
except ImportError:
    ICON_NAME = "favicon.ico" # Fallback


class FileConverter(ttk.Toplevel):
    """
    Toplevel window for converting various media files using ffmpeg.
    """
    def __init__(self, main_app):
        super().__init__(main_app)
        self.main_app = main_app
        self.title("File Converter (ffmpeg-python)")
        
        self.geometry("450x650") # Height for feedback bar
        
        self.center_window(450, 650)
        self.resizable(False, False)

        self.is_closing = False
        
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
        """Creates and places all widgets in the converter window."""
        main_frame = ttk.Frame(self, padding="20")
        main_frame.pack(expand=True, fill="both")

        label = ttk.Label(main_frame, text="File Converter", 
                          bootstyle="primary", font=("Segoe UI", 16, "bold"), 
                          anchor="center")
        label.pack(pady=10, fill="x")

        # --- Video Conversion ---
        self.video_frame = ttk.Labelframe(main_frame, text="Video Conversion", padding=15)
        self.video_frame.pack(pady=10, fill="x")

        (ttk.Button(self.video_frame, text="MP4 to AVI", command=self.start_mp4_to_avi)
            .grid(row=0, column=0, padx=5, pady=5, sticky="ew"))
        (ttk.Button(self.video_frame, text="AVI to MP4", command=self.start_avi_to_mp4)
            .grid(row=0, column=1, padx=5, pady=5, sticky="ew"))
        (ttk.Button(self.video_frame, text="MKV to MP4", command=self.start_mkv_to_mp4)
            .grid(row=1, column=0, padx=5, pady=5, sticky="ew"))
        (ttk.Button(self.video_frame, text="MP4 to MKV", command=self.start_mp4_to_mkv)
            .grid(row=1, column=1, padx=5, pady=5, sticky="ew"))
        
        self.video_frame.grid_columnconfigure(0, weight=1)
        self.video_frame.grid_columnconfigure(1, weight=1)

        # --- Audio Conversion ---
        self.audio_frame = ttk.Labelframe(main_frame, text="Audio Conversion", padding=15)
        self.audio_frame.pack(pady=10, fill="x")

        (ttk.Button(self.audio_frame, text="WAV to MP3", command=self.start_wav_to_mp3)
            .grid(row=0, column=0, padx=5, pady=5, sticky="ew"))
        (ttk.Button(self.audio_frame, text="MP3 to WAV", command=self.start_mp3_to_wav)
            .grid(row=0, column=1, padx=5, pady=5, sticky="ew"))
        (ttk.Button(self.audio_frame, text='M4A to MP3', command=self.start_m4a_to_mp3)
            .grid(row=1, column=0, padx=5, pady=5, sticky="ew"))
        (ttk.Button(self.audio_frame, text='MP3 to M4A', command=self.start_mp3_to_m4a)
            .grid(row=1, column=1, padx=5, pady=5, sticky="ew"))

        self.audio_frame.grid_columnconfigure(0, weight=1)
        self.audio_frame.grid_columnconfigure(1, weight=1)

        # --- Video to Audio Conversion ---
        self.video_to_audio_frame = ttk.Labelframe(main_frame, text="Video to Audio", padding=15)
        self.video_to_audio_frame.pack(pady=10, fill="x")

        (ttk.Button(self.video_to_audio_frame, text="Extract Audio (to MP3)", 
                    command=self.start_video_to_audio, bootstyle="primary")
            .pack(fill="x", padx=5, pady=5))

        # --- Feedback Widgets ---
        self.progress_bar = ttk.Progressbar(main_frame, orient='horizontal', 
                                            mode='indeterminate', 
                                            bootstyle="primary-striped")
        self.progress_bar.pack(pady=5, fill="x")
        self.progress_bar.pack_forget() # Hidden by default

        self.result_label = ttk.Label(main_frame, text="Waiting for conversion...", anchor="center")
        self.result_label.pack(pady=10)

        # --- Library Error Handling ---
        if not LIBS_OK:
            warning_label = ttk.Label(
                main_frame, 
                text=FFMPEG_ERROR_MESSAGE,
                bootstyle="danger", 
                anchor="center",
                wraplength=400 
            )
            warning_label.pack(pady=5, fill="x")
            self.geometry("450x700") # Make window taller for the error
            
            # Disable all conversion buttons
            self.disable_buttons(self.video_frame)
            self.disable_buttons(self.audio_frame)
            self.disable_buttons(self.video_to_audio_frame)

        # --- Navigation Buttons ---
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(pady=10, fill="x")

        back_button = ttk.Button(button_frame, text="Back", command=self.go_back, bootstyle="secondary-outline")
        back_button.pack(side="left", expand=True, padx=5)

        exit_button = ttk.Button(button_frame, text="Exit App", command=self.exit_app, bootstyle="danger")
        exit_button.pack(side="left", expand=True, padx=5)

    def disable_buttons(self, frame):
        """Disables all buttons within a given frame."""
        for child in frame.winfo_children():
            if isinstance(child, ttk.Button):
                child.config(state="disabled")

    def toggle_conversion_buttons(self, enable=True):
        """Enable or disable all conversion buttons."""
        if not LIBS_OK: # Never enable if libs failed
            return
            
        state = "normal" if enable else "disabled"
        for frame in [self.video_frame, self.audio_frame, self.video_to_audio_frame]:
            for child in frame.winfo_children():
                if isinstance(child, ttk.Button):
                    child.config(state=state)
    
    def stop_feedback_safe(self):
        """Stops progress bar and re-enables buttons from main thread."""
        if self.is_closing:
            return
        self.progress_bar.stop()
        self.progress_bar.pack_forget()
        self.toggle_conversion_buttons(enable=True)

    def update_status_safe(self, message, style="success"):
        """Safely updates the status label from any thread."""
        if self.is_closing:
            return
        try:
            self.after(0, lambda: self.result_label.config(text=message, bootstyle=style))
        except Exception as e:
            print(f"UI update error: {e}")
    
    def start_conversion_thread(self, target_function, input_file, output_file, **kwargs):
        """Safely starts the conversion function in a separate thread."""
        if self.is_closing: return

        if not LIBS_OK:
            self.update_status_safe(FFMPEG_ERROR_MESSAGE, style="danger")
            return
        
        # Start feedback
        self.progress_bar.pack(pady=5, fill="x")
        self.progress_bar.start(10)
        self.toggle_conversion_buttons(enable=False)
        self.update_status_safe(f"Processing '{os.path.basename(input_file)}'...", style="info")
        
        conversion_thread = threading.Thread(
            target=target_function, 
            args=(input_file, output_file), 
            kwargs=kwargs,
            daemon=True
        )
        conversion_thread.start()

    def get_files_and_run(self, conversion_func, open_types, save_types, save_ext, **kwargs):
        """
        Handles the file dialogs in the main thread before starting
        the conversion thread.
        """
        if self.is_closing or not LIBS_OK:
            self.update_status_safe(FFMPEG_ERROR_MESSAGE, style="danger")
            return

        input_file = filedialog.askopenfilename(title=f"Select {open_types[0][0]} File", filetypes=open_types)
        if not input_file:
            self.update_status_safe("Operation cancelled", "warning")
            return

        output_file = filedialog.asksaveasfilename(title="Save As", filetypes=save_types, defaultextension=save_ext)
        if not output_file:
            self.update_status_safe("Operation cancelled", "warning")
            return
            
        self.start_conversion_thread(conversion_func, input_file, output_file, **kwargs)

    # --- Conversion Starter Methods ---

    def start_mp4_to_avi(self):
        self.get_files_and_run(self.run_convert_video, 
                               [("MP4 Files", "*.mp4")], [("AVI Files", "*.avi")], ".avi", 
                               vcodec='libxvid')

    def start_avi_to_mp4(self):
        self.get_files_and_run(self.run_convert_video, 
                               [("AVI Files", "*.avi")], [("MP4 Files", "*.mp4")], ".mp4", 
                               vcodec='libx264')

    def start_mkv_to_mp4(self):
        self.get_files_and_run(self.run_convert_video, 
                               [("MKV Files", "*.mkv")], [("MP4 Files", "*.mp4")], ".mp4", 
                               vcodec='libx264', acodec='copy')

    def start_mp4_to_mkv(self):
        self.get_files_and_run(self.run_convert_video, 
                               [("MP4 Files", "*.mp4")], [("MKV Files", "*.mkv")], ".mkv", 
                               vcodec='copy', acodec='copy')

    def start_wav_to_mp3(self):
        self.get_files_and_run(self.run_convert_audio, 
                               [("WAV Files", "*.wav")], [("MP3 Files", "*.mp3")], ".mp3", 
                               acodec='libmp3lame', audio_bitrate='192k')

    def start_mp3_to_wav(self):
        self.get_files_and_run(self.run_convert_audio, 
                               [("MP3 Files", "*.mp3")], [("WAV Files", "*.wav")], ".wav")

    def start_m4a_to_mp3(self):
        self.get_files_and_run(self.run_convert_audio, 
                               [("M4A Files", "*.m4a")], [("MP3 Files", "*.mp3")], ".mp3", 
                               acodec='libmp3lame', audio_bitrate='192k')

    def start_mp3_to_m4a(self):
        self.get_files_and_run(self.run_convert_audio, 
                               [("MP3 Files", "*.mp3")], [("M4A Files", "*.m4a")], ".m4a", 
                               acodec='aac')

    def start_video_to_audio(self):
        self.get_files_and_run(self.run_extract_audio, 
                               [("Video Files", "*.mp4;*.avi;*.mkv")], [("MP3 Files", "*.mp3")], ".mp3")


    # --- Core Conversion Functions (Threaded) ---

    def run_convert_video(self, input_file, output_file, **kwargs):
        """(THREAD) Runs the video conversion."""
        try:
            import ffmpeg
            stream = ffmpeg.input(input_file)
            stream = ffmpeg.output(stream, output_file, **kwargs)
            ffmpeg.run(stream, overwrite_output=True, quiet=True) 
            
            if self.is_closing: return
            self.update_status_safe("Conversion Successful!", style="success")
        except ImportError:
             self.update_status_safe(FFMPEG_ERROR_MESSAGE, style="danger")
        except Exception as e:
            if self.is_closing: return
            self.update_status_safe(f"Error: {e}", style="danger")
        finally:
            if not self.is_closing:
                self.after(0, self.stop_feedback_safe)

    def run_convert_audio(self, input_file, output_file, **kwargs):
        """(THREAD) Runs the audio conversion."""
        try:
            import ffmpeg
            stream = ffmpeg.input(input_file)
            stream = ffmpeg.output(stream, output_file, **kwargs)
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
            
            if self.is_closing: return
            self.update_status_safe("Conversion Successful!", style="success")
        except ImportError:
             self.update_status_safe(FFMPEG_ERROR_MESSAGE, style="danger")
        except Exception as e:
            if self.is_closing: return
            self.update_status_safe(f"Error: {e}", style="danger")
        finally:
            if not self.is_closing:
                self.after(0, self.stop_feedback_safe)

    def run_extract_audio(self, input_file, output_file, **kwargs):
        """(THREAD) Runs the audio extraction."""
        try:
            import ffmpeg
            stream = ffmpeg.input(input_file)
            stream = ffmpeg.output(stream, output_file, 
                                   vn=None, acodec='libmp3lame', audio_bitrate='192k', 
                                   **kwargs)
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
            
            if self.is_closing: return
            self.update_status_safe("Audio Extraction Successful!", style="success")
        except ImportError:
             self.update_status_safe(FFMPEG_ERROR_MESSAGE, style="danger")
        except Exception as e:
            if self.is_closing: return
            self.update_status_safe(f"Error: {e}", style="danger")
        finally:
            if not self.is_closing:
                self.after(0, self.stop_feedback_safe)

    # --- Window Closing Methods ---

    def go_back(self):
        """Closes this window and returns to the main app."""
        self.close_window() 
        self.main_app.show_main_window(None) # Pass None, as we destroyed it

    def close_window(self):
        """Safely closes the window."""
        self.is_closing = True 
        self.destroy() 

    def exit_app(self):
        """Exits the entire application."""
        self.is_closing = True 
        self.main_app.exit_app()

if __name__ == "__main__":
    print("ERROR: This file cannot be run directly.")
    print("Please run 'main.py' instead.")