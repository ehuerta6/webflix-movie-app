import os
import subprocess
import sys
import venv
from pathlib import Path

def setup_venv():
    """Create and setup virtual environment"""
    venv_path = Path("venv")
    
    # Create venv if it doesn't exist
    if not venv_path.exists():
        print("Creating virtual environment...")
        venv.create(venv_path, with_pip=True)
    else:
        print("Virtual environment already exists.")
    
    # Determine the Python executable path in the virtual environment
    if os.name == 'nt':  # Windows
        python_exe = venv_path / "Scripts" / "python.exe"
    else:  # Unix/MacOS
        python_exe = venv_path / "bin" / "python"
    
    # Check if pip is available
    if not os.path.exists(python_exe):
        print("Error: Python executable not found in virtual environment.")
        return False
    
    # Install requirements
    print("Installing requirements...")
    subprocess.check_call([str(python_exe), "-m", "pip", "install", "-r", "requirements.txt"])
    
    return True

def check_env_file():
    """Check if .env file exists, create a template if it doesn't"""
    env_path = Path(".env")
    
    if not env_path.exists():
        print("Creating .env template file...")
        with open(env_path, "w") as f:
            f.write("# TMDB API Key (required)\n")
            f.write("TMDB_API_KEY=your_tmdb_api_key_here\n\n")
            f.write("# Flask settings\n")
            f.write("FLASK_APP=app.py\n")
            f.write("FLASK_ENV=development\n")
        print("Please edit the .env file and add your TMDB API key.")
    else:
        print(".env file already exists.")

def main():
    """Main setup function"""
    print("Starting Webflix backend setup...")
    
    # Setup virtual environment and install requirements
    if setup_venv():
        print("Virtual environment setup completed successfully.")
    else:
        print("Virtual environment setup failed.")
        return
    
    # Check .env file
    check_env_file()
    
    print("\nSetup completed!")
    print("\nTo activate the virtual environment:")
    if os.name == 'nt':  # Windows
        print("    venv\\Scripts\\activate")
    else:  # Unix/MacOS
        print("    source venv/bin/activate")
    
    print("\nTo run the Flask application:")
    print("    flask run")

if __name__ == "__main__":
    main() 